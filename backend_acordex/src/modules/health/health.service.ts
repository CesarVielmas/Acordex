import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { REDIS_CLIENT } from '@/core/redis/redis.module';
import Redis from 'ioredis';

export interface ServiceHealth {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const databaseHealth = await this.checkDatabase();
    const redisHealth = await this.checkRedis();

    const isAllUp = databaseHealth.status === 'up' && redisHealth.status === 'up';
    const isAnyUp = databaseHealth.status === 'up' || redisHealth.status === 'up';

    const overallStatus: 'ok' | 'degraded' | 'error' = isAllUp
      ? 'ok'
      : isAnyUp
        ? 'degraded'
        : 'error';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: databaseHealth,
        redis: redisHealth,
      },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      this.logger.error('PostgreSQL Health Check Failed', err?.message || err);
      return {
        status: 'down',
        error: err?.message || 'Database connection error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      if (this.redis.status === 'wait' || this.redis.status === 'close') {
        await this.redis.connect();
      }
      const response = await this.redis.ping();
      if (response === 'PONG') {
        return {
          status: 'up',
          latencyMs: Date.now() - start,
        };
      }
      return {
        status: 'down',
        error: `Unexpected ping response: ${response}`,
      };
    } catch (err: any) {
      this.logger.error('Redis Health Check Failed', err?.message || err);
      return {
        status: 'down',
        error: err?.message || 'Redis connection error',
      };
    }
  }
}
