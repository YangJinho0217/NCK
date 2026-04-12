export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

/** 단일 PK: string | number, 복합 FK: { productId: 'PRD001', productEventId: 'EVT001' } */
export type ActionLogTargetId = string | number | Record<string, string | number>;

export interface ActionLogEntry {
  /** 액션 종류 */
  action: ActionType;
  /** 모듈명 (예: 'product-event', 'product-to-product-event') */
  module: string;
  /**
   * 대상 리소스 식별자
   * - 단일 PK 테이블: string | number   ex) 'EVT001'
   * - 복합 FK 관계 테이블: Record     ex) { productId: 'PRD001', productEventId: 'EVT001' }
   */
  targetId?: ActionLogTargetId;
  /** 변경 전 데이터 */
  before?: Record<string, any>;
  /** 변경 후 데이터 */
  after?: Record<string, any>;
  /** 요청 유저 ID (추후 인증 연동 시 사용) */
  userId?: string;
  /** 추가 메타데이터 */
  metadata?: Record<string, any>;
}

/** 어댑터가 구현해야 할 인터페이스 */
export interface IActionLogAdapter {
  write(entry: ActionLogEntry & { timestamp: Date }): Promise<void>;
}
