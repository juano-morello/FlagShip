/**
 * Update Environment DTO
 * Request body for PATCH /v1/admin/environments/:id
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Update Environment Request DTO
 * Note: type is immutable after creation
 */
export class UpdateEnvironmentDto {
  @ApiPropertyOptional({
    description: 'Environment name',
    example: 'Production Environment',
    minLength: 1,
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({
    description: 'Environment-specific settings',
    example: { debugMode: false, logLevel: 'info' },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Whether this is the default environment',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

