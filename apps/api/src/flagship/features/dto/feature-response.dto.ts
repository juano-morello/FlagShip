/**
 * Feature Response DTO
 * Response shape for feature endpoints
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeatureType } from './create-feature.dto';

/**
 * Feature Rule DTO (for environment-specific behavior)
 */
export class FeatureRuleDto {
  @ApiProperty({ description: 'Rule ID' })
  id!: string;

  @ApiProperty({ description: 'Rule type', example: 'override' })
  ruleType!: string;

  @ApiProperty({ description: 'Rule value', example: { enabled: true } })
  value!: Record<string, unknown>;

  @ApiProperty({ description: 'Rule priority (higher = evaluated first)' })
  priority!: number;

  @ApiProperty({ description: 'Whether the rule is enabled' })
  enabled!: boolean;
}

/**
 * Feature Response DTO
 */
export class FeatureResponseDto {
  @ApiProperty({ description: 'Feature ID' })
  id!: string;

  @ApiProperty({ description: 'Project ID' })
  projectId!: string;

  @ApiProperty({ description: 'Feature key', example: 'enable_dark_mode' })
  key!: string;

  @ApiProperty({ description: 'Display name', example: 'Dark Mode' })
  name!: string;

  @ApiPropertyOptional({ description: 'Feature description' })
  description!: string | null;

  @ApiProperty({ description: 'Feature type', enum: FeatureType })
  type!: FeatureType;

  @ApiProperty({ description: 'Default value when no rules match' })
  defaultValue!: boolean;

  @ApiProperty({ description: 'Master kill switch' })
  enabled!: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp (ISO 8601)' })
  updatedAt!: string;

  @ApiPropertyOptional({
    description: 'Environment-specific rules (only on GET by ID)',
    type: [FeatureRuleDto],
  })
  rules?: FeatureRuleDto[];
}

/**
 * Paginated Features Response DTO
 */
export class PaginatedFeaturesDto {
  @ApiProperty({ description: 'Feature items', type: [FeatureResponseDto] })
  items!: FeatureResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;
}

