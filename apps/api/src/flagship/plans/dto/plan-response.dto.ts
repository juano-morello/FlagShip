/**
 * Plan Response DTO
 * Response shape for plan endpoints
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Plan Response DTO
 */
export class PlanResponseDto {
  @ApiProperty({ description: 'Plan ID', example: 'plan_8f3d4e2c-1234-5678-9abc-def012345678' })
  id!: string;

  @ApiProperty({ description: 'Plan name (slug)', example: 'pro' })
  name!: string;

  @ApiProperty({ description: 'Display name', example: 'Pro Plan' })
  displayName!: string;

  @ApiPropertyOptional({ description: 'Plan description', example: 'Professional tier with advanced features' })
  description!: string | null;

  @ApiProperty({
    description: 'Plan limits',
    example: { api_calls_monthly: 100000, storage_bytes: 10737418240, seats: 10 },
  })
  limits!: Record<string, number>;

  @ApiProperty({
    description: 'Feature keys included in this plan',
    example: ['api-access', 'advanced-analytics', 'priority-support'],
  })
  features!: string[];

  @ApiPropertyOptional({ description: 'Monthly price in cents', example: 4900 })
  priceMonthly!: number | null;

  @ApiPropertyOptional({ description: 'Yearly price in cents', example: 49000 })
  priceYearly!: number | null;

  @ApiPropertyOptional({ description: 'Stripe monthly price ID', example: 'price_1234567890' })
  stripePriceIdMonthly!: string | null;

  @ApiPropertyOptional({ description: 'Stripe yearly price ID', example: 'price_0987654321' })
  stripePriceIdYearly!: string | null;

  @ApiPropertyOptional({ description: 'Stripe metered price ID', example: 'price_metered_123' })
  stripeMeteredPriceId!: string | null;

  @ApiProperty({ description: 'Whether the plan is active', example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Sort order for display', example: 2 })
  sortOrder!: number | null;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)', example: '2024-12-26T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp (ISO 8601)', example: '2024-12-26T10:30:00.000Z' })
  updatedAt!: string;
}

/**
 * Paginated Plans Response DTO
 */
export class PaginatedPlansDto {
  @ApiProperty({ description: 'Plan items', type: [PlanResponseDto] })
  items!: PlanResponseDto[];

  @ApiProperty({ description: 'Total count', example: 3 })
  total!: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit!: number;
}

