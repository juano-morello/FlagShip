/**
 * Query Environments DTO
 * Query parameters for GET /v1/admin/environments
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EnvironmentType } from './create-environment.dto';

/**
 * Query Environments Request DTO
 */
export class QueryEnvironmentsDto {
  @ApiPropertyOptional({
    description: 'Search in environment name',
    example: 'production',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by environment type',
    enum: EnvironmentType,
    example: EnvironmentType.PRODUCTION,
  })
  @IsOptional()
  @IsEnum(EnvironmentType)
  type?: EnvironmentType;

  @ApiPropertyOptional({
    description: 'Filter by default status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

