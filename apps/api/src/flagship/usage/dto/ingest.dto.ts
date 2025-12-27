/**
 * Usage Ingestion DTOs
 * Request and response types for POST /v1/usage/ingest
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsObject,
  Min,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Single usage event to ingest
 */
export class UsageEventDto {
  @ApiProperty({
    description: 'Metric identifier (e.g., "api_calls", "storage_bytes")',
    example: 'api_calls',
  })
  @IsString()
  @MaxLength(100)
  metric!: string;

  @ApiProperty({
    description: 'Change amount (positive to increment, negative to decrement)',
    example: 1,
  })
  @IsNumber()
  delta!: number;

  @ApiPropertyOptional({
    description: 'When the event occurred (ISO 8601). Defaults to server time.',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Idempotency key to prevent duplicate processing',
    example: 'req_abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description: 'Additional context for the event',
    example: { endpoint: '/api/users', method: 'GET' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string | number>;
}

/**
 * Request body for POST /v1/usage/ingest
 */
export class IngestRequestDto {
  @ApiProperty({
    description: 'Array of usage events to ingest (1-1000 events)',
    type: [UsageEventDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => UsageEventDto)
  events!: UsageEventDto[];
}

/**
 * Error detail for a rejected event
 */
export class IngestErrorDto {
  @ApiProperty({ description: 'Index of the rejected event in the request' })
  index!: number;

  @ApiProperty({ description: 'Metric key of the rejected event' })
  metric!: string;

  @ApiProperty({ description: 'Reason for rejection' })
  reason!: string;
}

/**
 * Usage summary after ingestion
 */
export class UsageSummaryDto {
  @ApiProperty({ description: 'Current usage value' })
  current!: number;

  @ApiProperty({ description: 'Configured limit (-1 for unlimited)' })
  limit!: number;

  @ApiProperty({ description: 'Remaining capacity (-1 for unlimited)' })
  remaining!: number;
}

/**
 * Response for POST /v1/usage/ingest (synchronous)
 */
export class IngestResponseDto {
  @ApiProperty({ description: 'Request tracking ID' })
  requestId!: string;

  @ApiProperty({ description: 'When the request was processed' })
  processedAt!: string;

  @ApiProperty({ description: 'Number of events accepted' })
  accepted!: number;

  @ApiProperty({ description: 'Number of events rejected' })
  rejected!: number;

  @ApiPropertyOptional({
    description: 'Details for rejected events',
    type: [IngestErrorDto],
  })
  errors?: IngestErrorDto[];

  @ApiPropertyOptional({
    description: 'Current usage summary per metric after ingestion',
  })
  summary?: Record<string, UsageSummaryDto>;
}

/**
 * Response for POST /v1/usage/ingest (async with queue)
 */
export class AsyncIngestResponseDto {
  @ApiProperty({ description: 'Request tracking ID' })
  requestId!: string;

  @ApiProperty({ description: 'Processing status', enum: ['queued'] })
  status!: 'queued';

  @ApiProperty({ description: 'When the request was queued' })
  queuedAt!: string;

  @ApiProperty({ description: 'Number of events queued' })
  eventCount!: number;

  @ApiPropertyOptional({ description: 'BullMQ job ID for tracking' })
  jobId?: string;
}

