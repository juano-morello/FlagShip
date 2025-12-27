/**
 * Create Environment DTO
 * Request body for POST /v1/admin/environments
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * Environment type enum
 */
export enum EnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Create Environment Request DTO
 */
export class CreateEnvironmentDto {
  @ApiProperty({
    description: 'Environment name',
    example: 'Production',
    minLength: 1,
    maxLength: 64,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string;

  @ApiProperty({
    description: 'Environment type (unique within project)',
    enum: EnvironmentType,
    example: EnvironmentType.PRODUCTION,
  })
  @IsEnum(EnvironmentType)
  type!: EnvironmentType;

  @ApiPropertyOptional({
    description: 'API key prefix (lowercase letters, numbers, underscores)',
    example: 'fsk_prod_',
    pattern: '^[a-z][a-z0-9_]*$',
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'API key prefix must start with a lowercase letter and contain only lowercase letters, numbers, and underscores',
  })
  apiKeyPrefix?: string;

  @ApiPropertyOptional({
    description: 'Environment-specific settings',
    example: { debugMode: true, logLevel: 'debug' },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Whether this is the default environment',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

