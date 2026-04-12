import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { PrismaModule } from './core/prisma/prisma.module';
import { HelpersModule } from './core/helpers/helpers.module';
import { ActionLogModule } from './core/log/action-log.module';
import { UserRoomSettingModule } from './modules/user-room-setting/user-room-setting.module';
import { UserPlayerSettingModule } from './modules/user-player-setting/user-player-setting.module';

// 환경별 .env 파일 결정
const nodeEnv = process.env.NODE_ENV || 'development';
const envFilePath = `.env.${nodeEnv}`;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePath,
      expandVariables: true,
      cache: true, // 성능 향상을 위한 캐싱
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.printf(({ level, message, timestamp, ms, ...meta }) => {
              const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}] ${message}${metaStr}`;
            }),
          ),
        }),
      ],
    }),
    PrismaModule,
    HelpersModule,
    ActionLogModule,
    UserRoomSettingModule,
    UserPlayerSettingModule,
  ]
})
export class AppModule { }
