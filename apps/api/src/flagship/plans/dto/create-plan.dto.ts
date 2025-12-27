/**
 * Create Plan DTO
 * Request body for POST /v1/admin/plans
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsNumber,
  IsInt,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';

/**
 * Create Plan Request DTO
 */
export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan name (lowercase letters, numbers, underscores, hyphens only)',
    example: 'pro',
    pattern: '^[a-z][a-z0-9_-]*$',
    maxLength: 64,
  })
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_-]*$/, {
    message: 'Name must start with a lowercase letter and contain only lowercase letters, numbers, underscores, and hyphens',
  })
  name!: string;

  @ApiProperty({
    description: 'Display name for the plan',
    example: 'Pro Plan',
    maxLength: 128,
  })
  @IsString()
  @MaxLength(128)
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Plan description',
    example: 'Professional tier with advanced features',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({
    description: 'Plan limits (e.g., api_calls_monthly, storage_bytes)',
    example: { api_calls_monthly: 100000, storage_bytes: 10737418240 },
  })
  @IsOptional()
  @IsObject()
  limits?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Feature keys included in this plan',
    example: ['api-access', 'advanced-analytics', 'priority-support'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Monthly price in cents',
    example: 4900,
  })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  priceMonthly?: number;

  @ApiPropertyOptional({
    description: 'Yearly price in cents',
    example: 49000,
  })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  priceYearly?: number;

  @ApiPropertyOptional({
    description: 'Stripe monthly price ID',
    example: 'price_1234567890',
  })
  @IsOptional()
  @IsString()
  stripePriceIdMonthly?: string;

  @ApiPropertyOptional({
    description: 'Stripe yearly price ID',
    example: 'price_0987654321',
  })
  @IsOptional()
  @IsString()
  stripePriceIdYearly?: string;

  @ApiPropertyOptional({
    description: 'Stripe metered price ID for usage-based billing',
    example: 'price_metered_123',
  })
  @IsOptional()
  @IsString()
  stripeMeteredPriceId?: string;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 2,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @IsInt()
  sortOrder?: number;
}

