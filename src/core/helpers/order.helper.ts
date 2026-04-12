import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/core/prisma/prisma.service';

/**
 * 순서 변경 옵션
 */


/**
 * 순서 변경 공통 헬퍼
 */
@Injectable()
export class OrderHelper {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * 순서 변경 로직
   * 
   * @param modelName Prisma 모델명 (예: 'visitorGrade', 'operationCategory')
   * @param id 변경할 항목 ID
   * @param newOrder 새로운 순서
   * @param options 추가 옵션 (where 조건, 트랜잭션 여부)
   * @returns 성공 여부
   * 
   * @example
   * // 기본 사용
   * await this.orderHelper.updateOrder('visitorGrade', 1, 5);
   * 
   * @example
   * // 추가 조건과 함께 사용
   * await this.orderHelper.updateOrder('visitorGrade', 1, 5, {
   *   additionalWhere: { type: 'paid_grade' }
   * });
   */
  async updateOrder(
    modelName: keyof typeof this.prisma,
    id: number | string,
    newOrder: number,
    additionalWhere: Record<string, any>,
    useTransaction: boolean = true,
  ): Promise<boolean> {
    // Prisma 모델 동적 접근
    const model = this.prisma[modelName as keyof typeof this.prisma] as any;

    if (!model) {
      throw new Error(`Invalid model name: ${String(modelName)}`);
    }

    // 현재 순위 조회
    const currentItem = await model.findFirst({
      where: {
        id,
        ...additionalWhere,
      },
      select: {
        order: true,
      },
    });

    if (!currentItem) {
      return false;
    }

    const oldOrder = currentItem.order;

    // 변경 순위와 현재 순위가 같으면 변경 불필요
    if (oldOrder === newOrder) {
      return true;
    }

    // 순서 변경 로직
    const updateOrderLogic = async (tx: any) => {
      if (newOrder < oldOrder) {
        // 위로 이동: 사이 항목들 순위 +1
        await tx[modelName].updateMany({
          where: {
            order: { gte: newOrder, lt: oldOrder },
            id: { not: id },
            ...additionalWhere,
          },
          data: { order: { increment: 1 } },
        });
      } else {
        // 아래로 이동: 사이 항목들 순위 -1
        await tx[modelName].updateMany({
          where: {
            order: { gt: oldOrder, lte: newOrder },
            id: { not: id },
            ...additionalWhere,
          },
          data: { order: { decrement: 1 } },
        });
      }

      // 대상 항목 순위 변경
      await tx[modelName].update({
        where: { id },
        data: { order: newOrder },
      });
    };

    // 트랜잭션 사용 여부에 따라 처리
    if (useTransaction) {
      await this.prisma.$transaction(async (tx) => {
        await updateOrderLogic(tx);
      });
    } else {
      await updateOrderLogic(this.prisma);
    }

    return true;
  }

  /**
   * 항목 삭제 시 순서 재정렬
   *
   * @param modelName Prisma 모델명
   * @param deletedOrder 삭제된 항목의 순서
   * @param additionalWhere 추가 옵션
   * @param tx 트랜잭션 클라이언트 (선택, 전달 시 동일 트랜잭션 내 실행)
   *
   * @example
   * await this.orderHelper.reorderAfterDelete('visitorGrade', 3, {
   *   additionalWhere: { type: 'paid_grade' }
   * });
   */
  async reorderAfterDelete(
    modelName: string,
    deletedOrder: number,
    additionalWhere: Record<string, any>,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    const model = client[modelName as keyof typeof client] as any;

    if (!model) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    // 삭제된 항목보다 순서가 큰 항목들의 순서를 -1
    await model.updateMany({
      where: {
        order: { gt: deletedOrder },
        ...additionalWhere,
      },
      data: { order: { decrement: 1 } },
    });
  }

  /**
   * 새 항목 추가 시 마지막 순서 반환
   *
   * @param modelName Prisma 모델명
   * @param additionalWhere 추가 옵션
   * @param tx 트랜잭션 클라이언트 (선택)
   * @returns 새로운 순서 번호
   */
  async getNextOrder(
    modelName: string,
    additionalWhere: Record<string, any>,
    tx?: any,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const model = client[modelName as keyof typeof client] as any;

    if (!model) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    const maxOrderItem = await model.findFirst({
      where: additionalWhere,
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return maxOrderItem ? maxOrderItem.order + 1 : 1;
  }
}
