import { Injectable, Logger } from '@nestjs/common';
import {
  environments,
  projects,
  Environment,
  NewEnvironment,
  withServiceContext,
  eq,
  and,
} from '@forgestack/db';

@Injectable()
export class EnvironmentsRepository {
  private readonly logger = new Logger(EnvironmentsRepository.name);

  async findById(id: string): Promise<Environment | null> {
    return withServiceContext('EnvironmentsRepository.findById', async (tx) => {
      const [env] = await tx
        .select()
        .from(environments)
        .where(eq(environments.id, id))
        .limit(1);
      return env || null;
    });
  }

  async findByProjectId(projectId: string): Promise<Environment[]> {
    return withServiceContext('EnvironmentsRepository.findByProjectId', async (tx) => {
      return tx
        .select()
        .from(environments)
        .where(eq(environments.projectId, projectId));
    });
  }

  async findByProjectAndType(
    projectId: string,
    type: 'development' | 'staging' | 'production',
  ): Promise<Environment | null> {
    return withServiceContext('EnvironmentsRepository.findByProjectAndType', async (tx) => {
      const [env] = await tx
        .select()
        .from(environments)
        .where(
          and(
            eq(environments.projectId, projectId),
            eq(environments.type, type),
          ),
        )
        .limit(1);
      return env || null;
    });
  }

  async create(data: NewEnvironment): Promise<Environment> {
    return withServiceContext('EnvironmentsRepository.create', async (tx) => {
      const [env] = await tx.insert(environments).values(data).returning();
      return env;
    });
  }

  async update(id: string, data: Partial<Omit<Environment, 'id' | 'createdAt'>>): Promise<Environment | null> {
    return withServiceContext('EnvironmentsRepository.update', async (tx) => {
      const [env] = await tx
        .update(environments)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(environments.id, id))
        .returning();
      return env || null;
    });
  }

  async delete(id: string): Promise<boolean> {
    return withServiceContext('EnvironmentsRepository.delete', async (tx) => {
      const result = await tx
        .delete(environments)
        .where(eq(environments.id, id))
        .returning({ id: environments.id });
      return result.length > 0;
    });
  }

  /**
   * Validate that an environment belongs to an organization
   * Checks via project -> org relationship
   */
  async validateEnvironmentAccess(
    environmentId: string,
    orgId: string,
  ): Promise<{ id: string; type: 'development' | 'staging' | 'production'; projectId: string } | null> {
    return withServiceContext('EnvironmentsRepository.validateEnvironmentAccess', async (tx) => {
      const [result] = await tx
        .select({
          id: environments.id,
          type: environments.type,
          projectId: environments.projectId,
        })
        .from(environments)
        .innerJoin(projects, eq(environments.projectId, projects.id))
        .where(
          and(
            eq(environments.id, environmentId),
            eq(projects.orgId, orgId),
          ),
        )
        .limit(1);
      return result || null;
    });
  }
}

