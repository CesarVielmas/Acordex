import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckResult, HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'System health check',
    description:
      'Verifies the active connectivity and responsiveness of PostgreSQL database and Redis cache.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status of the service and its infrastructure dependencies.',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-08-17T15:00:00.000Z',
        uptime: 12.34,
        services: {
          database: { status: 'up', latencyMs: 2 },
          redis: { status: 'up', latencyMs: 1 },
        },
      },
    },
  })
  async getHealth(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
