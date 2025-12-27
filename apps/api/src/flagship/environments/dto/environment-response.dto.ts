/**
 * Environment Response DTO
 * Response shape for environment endpoints
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnvironmentType } from './create-environment.dto';

/**
 * Environment Response DTO
 */
export class EnvironmentResponseDto {
  @ApiProperty({ description: 'Environment ID' })
  id!: string;

  @ApiProperty({ description: 'Project ID' })
  projectId!: string;

  @ApiProperty({ description: 'Environment name', example: 'Production' })
  name!: string;

  @ApiProperty({ description: 'Environment type', enum: EnvironmentType })
  type!: EnvironmentType;

  @ApiProperty({ description: 'API key prefix', example: 'fsk_prod_' })
  apiKeyPrefix!: string;

  @ApiProperty({ description: 'Whether this is the default environment' })
  isDefault!: boolean;

  @ApiPropertyOptional({ description: 'Environment-specific settings' })
  settings!: Record<string, unknown> | null;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp (ISO 8601)' })
  updatedAt!: string;
}

/**
 * Paginated Environments Response DTO
 */
export class PaginatedEnvironmentsDto {
  @ApiProperty({ description: 'Environment items', type: [EnvironmentResponseDto] })
  items!: EnvironmentResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Current page' })
  page!: number;

  @ApiProperty({ description: 'Items per page' })
  limit!: number;
}

