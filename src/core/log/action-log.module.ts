import { Global, Module } from '@nestjs/common';
import { ActionLogService } from './action-log.service';

/**
 * 액션 로그 모듈 (Global)
 *
 * 어댑터 연동 방법:
 *
 * 1. MongoDB 연동 시:
 *    providers에 { provide: MONGO_LOG_ADAPTER, useClass: MongoLogAdapter } 추가
 *    ActionLogService 생성자에서 @Inject(MONGO_LOG_ADAPTER) 주입
 *
 * (필요 시 다른 저장소 어댑터도 동일 패턴으로 추가)
 */
@Global()
@Module({
  providers: [ActionLogService],
  exports: [ActionLogService],
})
export class ActionLogModule {}
