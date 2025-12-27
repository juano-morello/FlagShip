/**
 * Query Features DTO
 * Query parameters for GET /v1/admin/features
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
import { FeatureType } from './create-feature.dto';

/**
 * Query Features Request DTO
 */
export class QueryFeaturesDto {
  @ApiPropertyOptional({
    description: 'Search in key and name',
    example: 'dark_mode',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by feature type',
    enum: FeatureType,
    example: FeatureType.BOOLEAN,
  })
  @IsOptional()
  @IsEnum(FeatureType)
  type?: FeatureType;

  @ApiPropertyOptional({
    description: 'Filter by enabled status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;

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

