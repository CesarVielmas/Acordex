import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { validateEnv } from './config/env.schema';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { WebsocketsModule } from './core/websockets/websockets.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration with strict Zod validation
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env', '.env.local'],
    }),

    // BullMQ Redis Queue Setup
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // Global Core Modules
    PrismaModule,
    RedisModule,
    WebsocketsModule,

    // Feature Modules
    HealthModule,
  ],
})
export class AppModule {}
