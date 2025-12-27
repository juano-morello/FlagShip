/**
 * Idempotency Service
 * Redis-based idempotency key storage for preventing duplicate event processing
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// 24 hours in seconds
const IDEMPOTENCY_TTL_SECONDS = 86400;
const KEY_PREFIX = 'idempotency';

@Injectable()
export class IdempotencyService implements OnModuleDestroy {
  private readonly logger = new Logger(IdempotencyService.name);
  private redis: Redis | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('Idempotency disabled - Redis not configured');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      });

      this.redis.on('error', (err) => {
        this.logger.error(`Redis error: ${err.message}`);
      });

      this.logger.log('Idempotency service initialized with Redis');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Build the Redis key for an idempotency entry
   */
  private buildKey(environmentId: string, idempotencyKey: string): string {
    return `${KEY_PREFIX}:${environmentId}:${idempotencyKey}`;
  }

  /**
   * Check if key exists and set it atomically
   * @returns true if key already exists (duplicate), false if new (set successfully)
   */
  async checkAndSet(environmentId: string, idempotencyKey: string): Promise<boolean> {
    if (!this.redis) {
      // If Redis is not configured, allow processing (no idempotency)
      return false;
    }

    try {
      const key = this.buildKey(environmentId, idempotencyKey);
      const value = new Date().toISOString();

      // SET with NX (only if not exists) and EX (expiry)
      // Returns 'OK' if set, null if key already exists
      const result = await this.redis.set(key, value, 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX');

      if (result === 'OK') {
        // Key was set - this is a new request
        return false;
      } else {
        // Key already exists - this is a duplicate
        this.logger.debug(`Duplicate idempotency key detected: ${key}`);
        return true;
      }
    } catch (error) {
      this.logger.error(`Idempotency check failed: ${error}`);
      // On error, allow processing to avoid blocking legitimate requests
      return false;
    }
  }

  /**
   * Check if a key has already been processed
   */
  async isProcessed(environmentId: string, idempotencyKey: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const key = this.buildKey(environmentId, idempotencyKey);
      const value = await this.redis.get(key);
      return value !== null;
    } catch (error) {
      this.logger.error(`Idempotency lookup failed: ${error}`);
      return false;
    }
  }
}

