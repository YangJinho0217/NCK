import { Injectable, Logger, Optional } from '@nestjs/common';
import { ActionLogEntry, ActionLogTargetId, ActionType, IActionLogAdapter } from './action-log.interface';

/**
 * 액션 로그 유틸 서비스
 *
 * 추후 MongoDB 등 외부 저장소 어댑터를 주입하면 해당 저장소에 로그를 기록합니다.
 * 어댑터 미주입 시 NestJS Logger(콘솔)에만 출력합니다.
 *
 * 사용 예시:
 *   this.actionLogService.log({ action: ActionType.CREATE, module: 'product-event', targetId: id, after: result });
 *   this.actionLogService.create('product-event', id, result);
 */
@Injectable()
export class ActionLogService {
  private readonly logger = new Logger(ActionLogService.name);

  constructor(
    // 추후 외부 저장소 어댑터 주입 시 아래 주석 해제 후 실제 어댑터 토큰으로 교체
    // @Optional() @Inject(MONGO_LOG_ADAPTER) private readonly mongoAdapter?: IActionLogAdapter,
    @Optional() private readonly adapter?: IActionLogAdapter,
  ) { }

  /** 공통 로그 기록 */
  async log(entry: ActionLogEntry): Promise<void> {
    const fullEntry = { ...entry, timestamp: new Date() };

    // 어댑터 연결 시 해당 저장소에 기록
    if (this.adapter) {
      try {
        await this.adapter.write(fullEntry);
      } catch (err) {
        this.logger.warn(`ActionLog adapter write failed: ${err?.message}`);
      }
    }

    // 콘솔 로그 (개발 환경 디버깅용 / 어댑터 없을 때도 항상 출력)

    console.log(fullEntry);
    this.logger.debug(
      `[${fullEntry.action}] ${fullEntry.module}${fullEntry.targetId ? ` #${this.serializeTargetId(fullEntry.targetId)}` : ''} ` +
      (fullEntry.userId ? `by user:${fullEntry.userId} ` : '') +
      `at ${fullEntry.timestamp.toISOString()}`,
    );
  }

  /** CREATE 액션 로그 */
  create(module: string, targetId?: string | number, after?: Record<string, any>, meta?: Omit<ActionLogEntry, 'action' | 'module' | 'targetId' | 'after'>): Promise<void> {
    return this.log({ action: ActionType.CREATE, module, targetId, after, ...meta });
  }

  /** UPDATE 액션 로그 */
  update(
    module: string,
    targetId?: string | number,
    before?: Record<string, any>,
    after?: Record<string, any>,
    meta?: Omit<ActionLogEntry, 'action' | 'module' | 'targetId' | 'before' | 'after'>,
  ): Promise<void> {
    return this.log({ action: ActionType.UPDATE, module, targetId, before, after, ...meta });
  }

  /** DELETE 액션 로그 */
  delete(module: string, targetId?: string | number, before?: Record<string, any>, meta?: Omit<ActionLogEntry, 'action' | 'module' | 'targetId' | 'before'>): Promise<void> {
    return this.log({ action: ActionType.DELETE, module, targetId, before, ...meta });
  }

  /** 복합키 직렬화: { productId: 'PRD001', productEventId: 'EVT001' } → 'productId:PRD001,productEventId:EVT001' */
  private serializeTargetId(targetId: ActionLogTargetId): string {
    if (typeof targetId === 'object') return Object.entries(targetId).map(([k, v]) => `${k}:${v}`).join(',');
    return String(targetId);
  }

  /** PATCH 액션 로그 */
  patch(
    module: string,
    targetId?: string | number,
    before?: Record<string, any>,
    after?: Record<string, any>,
    meta?: Omit<ActionLogEntry, 'action' | 'module' | 'targetId' | 'before' | 'after'>,
  ): Promise<void> {
    return this.log({ action: ActionType.PATCH, module, targetId, before, after, ...meta });
  }
}
