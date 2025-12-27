/**
 * @CurrentEnvironment() parameter decorator
 * Extracts the FlagShip context (environment info) from the request
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FlagshipContext } from '../guards/environment.guard';

export const CurrentEnvironment = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): FlagshipContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.flagshipContext;
  },
);

/**
 * Alias for CurrentEnvironment for clarity in different contexts
 */
export const FlagshipCtx = CurrentEnvironment;

