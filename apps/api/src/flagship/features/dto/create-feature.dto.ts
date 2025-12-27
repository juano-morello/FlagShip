/**
 * Create Feature DTO
 * Request body for POST /v1/admin/features
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * Feature type enum
 */
export enum FeatureType {
  BOOLEAN = 'boolean',
  PERCENTAGE = 'percentage',
  PLAN = 'plan',
}

/**
 * Create Feature Request DTO
 */
export class CreateFeatureDto {
  @ApiProperty({
    description: 'Feature key (lowercase letters, numbers, underscores only)',
    example: 'enable_dark_mode',
    pattern: '^[a-z][a-z0-9_]*$',
    maxLength: 64,
  })
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Key must start with a lowercase letter and contain only lowercase letters, numbers, and underscores',
  })
  key!: string;

  @ApiProperty({
    description: 'Display name for the feature',
    example: 'Dark Mode',
    maxLength: 128,
  })
  @IsString()
  @MaxLength(128)
  name!: string;

  @ApiPropertyOptional({
    description: 'Feature description',
    example: 'Enable dark mode toggle for users',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @ApiProperty({
    description: 'Feature type',
    enum: FeatureType,
    example: FeatureType.BOOLEAN,
  })
  @IsEnum(FeatureType)
  type!: FeatureType;

  @ApiPropertyOptional({
    description: 'Default value when no rules match',
    example: false,
    default: false,
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

