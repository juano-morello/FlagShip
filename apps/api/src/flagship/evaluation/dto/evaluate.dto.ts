/**
 * Evaluation DTOs
 * Request and response types for the /v1/evaluate endpoint
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';

/**
 * Request DTO for POST /v1/evaluate
 */
export class EvaluateRequestDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Array of feature keys to evaluate',
    example: ['billing_v2', 'ai_chat', 'advanced_analytics'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of limit keys to check',
    example: ['api_calls', 'storage_bytes'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  limits?: string[];

  @ApiPropertyOptional({
    description: 'Evaluation context (e.g., userId for percentage rollouts)',
    example: { userId: 'usr_abc123' },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Include debug information in response',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  debug?: boolean;
}

/**
 * Feature evaluation result
 */
export class FeatureResultDto {
  @ApiProperty({ description: 'Evaluated value (true/false for boolean features)' })
  value!: boolean;

  @ApiPropertyOptional({ description: 'Reason for the evaluation result (if debug=true)' })
  reason?: string;
}

/**
 * Limit check result
 */
export class LimitResultDto {
  @ApiProperty({ description: 'Whether the limit allows the operation' })
  allowed!: boolean;

  @ApiProperty({ description: 'Current usage value' })
  current!: number;

  @ApiProperty({ description: 'Maximum limit value' })
  limit!: number;

  @ApiProperty({ description: 'Remaining capacity' })
  remaining!: number;

  @ApiPropertyOptional({ description: 'Reason for the limit status (if debug=true)' })
  reason?: string;
}

/**
 * Response DTO for POST /v1/evaluate
 */
export class EvaluateResponseDto {
  @ApiProperty({ description: 'Request ID for tracing' })
  requestId!: string;

  @ApiProperty({ description: 'Timestamp of evaluation' })
  evaluatedAt!: string;

  @ApiProperty({
    description: 'Feature evaluation results keyed by feature key',
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/FeatureResultDto' },
  })
  features!: Record<string, FeatureResultDto>;

  @ApiProperty({
    description: 'Limit check results keyed by limit key',
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/LimitResultDto' },
  })
  limits!: Record<string, LimitResultDto>;
}

