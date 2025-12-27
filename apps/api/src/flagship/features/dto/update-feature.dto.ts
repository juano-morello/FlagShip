/**
 * Update Feature DTO
 * Request body for PATCH /v1/admin/features/:id
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

/**
 * Update Feature Request DTO
 * Note: key and type are immutable after creation
 */
export class UpdateFeatureDto {
  @ApiPropertyOptional({
    description: 'Display name for the feature',
    example: 'Dark Mode Toggle',
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({
    description: 'Feature description',
    example: 'Enable dark mode toggle for users',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({
    description: 'Master kill switch for the feature',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Default value when no rules match',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  defaultValue?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { category: 'ui', tags: ['beta'] },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

