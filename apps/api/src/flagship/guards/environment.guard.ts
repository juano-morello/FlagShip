import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EnvironmentsRepository } from '../environments/environments.repository';

export interface FlagshipContext {
  environmentId: string;
  environmentType: 'development' | 'staging' | 'production';
  projectId: string;
  orgId: string;
}

export const FLAGSHIP_CONTEXT_KEY = 'flagshipContext';

@Injectable()
export class EnvironmentGuard implements CanActivate {
  private readonly logger = new Logger(EnvironmentGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => EnvironmentsRepository))
    private readonly environmentsRepository: EnvironmentsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get tenant context from TenantContextGuard (must run first)
    const tenantContext = request.tenantContext;
    if (!tenantContext) {
      throw new BadRequestException('Tenant context required - ensure TenantContextGuard runs first');
    }

    // Extract environment ID from header or API key
    const environmentId = this.extractEnvironmentId(request);
    if (!environmentId) {
      throw new BadRequestException('X-Environment header required');
    }

    // Validate environment exists and belongs to org
    const environment = await this.environmentsRepository.validateEnvironmentAccess(
      environmentId,
      tenantContext.orgId,
    );
    if (!environment) {
      throw new BadRequestException('Invalid environment or access denied');
    }

    // Attach FlagShip context to request
    const flagshipContext: FlagshipContext = {
      environmentId: environment.id,
      environmentType: environment.type,
      projectId: environment.projectId,
      orgId: tenantContext.orgId,
    };
    request.flagshipContext = flagshipContext;

    this.logger.debug(`FlagShip context set: env=${environment.type}, project=${environment.projectId}`);
    return true;
  }

  private extractEnvironmentId(request: any): string | undefined {
    // Check header first
    const envHeader = request.headers['x-environment'];
    if (envHeader) {
      return envHeader;
    }

    // Could also infer from API key prefix if using API key auth
    // This would be implementation-specific based on your API key structure
    return undefined;
  }
}

