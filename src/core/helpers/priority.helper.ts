import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/core/prisma/prisma.service';

/**
 * 우선순위 변경 옵션
 */


/**
 * 우선순위 변경 공통 헬퍼
 */
@Injectable()
export class PriorityHelper {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * 우선순위 변경 로직
   * 
   * @param modelName Prisma 모델명 (예: 'visitorGrade', 'operationCategory')
   * @param id 변경할 항목 ID
   * @param newPriority 새로운 우선순위
   * @param options 추가 옵션 (where 조건, 트랜잭션 여부)
   * @returns 성공 여부
   * 
   * @example
   * // 기본 사용
   * await this.priorityHelper.updatePriority('visitorGrade', 1, 5);  
   */
  async updatePriority(
    modelName: keyof typeof this.prisma,
    id: number | string,
    newPriority: number,
    additionalWhere: Record<string, any>,
    useTransaction: boolean = true,
  ): Promise<boolean> {
    // Prisma 모델 동적 접근
    const model = this.prisma[modelName as keyof typeof this.prisma] as any;

    if (!model) {
      throw new Error(`Invalid model name: ${String(modelName)}`);
    }

    // 현재 우선순위 조회
    const currentItem = await model.findFirst({
      where: {
        id,
        ...additionalWhere,
      },
      select: {
        priority: true,
      },
    });

    if (!currentItem) {
      return false;
    }

    const oldPriority = currentItem.priority;

    // 변경 우선순위와 현재 우선순위가 같으면 변경 불필요
    if (oldPriority === newPriority) {
      return true;
    }

    // 우선순위 변경 로직
    const updatePriorityLogic = async (tx: any) => {
      if (newPriority < oldPriority) {
        // 위로 이동: 사이 항목들 우선순위 +1
        await tx[modelName].updateMany({
          where: {
            priority: { not: null, gte: newPriority, lt: oldPriority },
            id: { not: id },
            ...additionalWhere,
          },
          data: { priority: { increment: 1 } },
        });
      } else {
        // 아래로 이동: 사이 항목들 우선순위 -1
        await tx[modelName].updateMany({
          where: {
            priority: { not: null, gt: oldPriority, lte: newPriority },
            id: { not: id },
            ...additionalWhere,
          },
          data: { priority: { decrement: 1 } },
        });
      }

      // 대상 항목 우선 순위 변경
      await tx[modelName].update({
        where: { id },
        data: { priority: newPriority },
      });
    };

    // 트랜잭션 사용 여부에 따라 처리
    if (useTransaction) {
      await this.prisma.$transaction(async (tx) => {
        await updatePriorityLogic(tx);
      });
    } else {
      await updatePriorityLogic(this.prisma);
    }

    return true;
  }

  /**
   * 항목 삭제 시 우선순위 재정렬
   *
   * @param modelName Prisma 모델명
   * @param deletedPriority 삭제된 항목의 우선순위
   * @param additionalWhere 추가 옵션
   * @param tx 트랜잭션 클라이언트 (선택, 전달 시 동일 트랜잭션 내 실행)
   *
   * @example
   * await this.priorityHelper.reorderAfterDelete('visitorGrade', 3, {
   *   additionalWhere: { type: 'paid_grade' }
   * });
   */
  async reorderAfterDelete(
    modelName: string,
    deletedPriority: number,
    additionalWhere: Record<string, any>,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    const model = client[modelName as keyof typeof client] as any;

    if (!model) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    // 삭제된 항목보다 우선순위가 큰 항목들의 우선순위를 -1
    await model.updateMany({
      where: {
        priority: { not: null, gt: deletedPriority },
        ...additionalWhere,
      },
      data: { priority: { decrement: 1 } },
    });
  }

  /**
   * 새 항목 추가 시 마지막 우선순위 반환
   *
   * @param modelName Prisma 모델명
   * @param additionalWhere 추가 옵션
   * @param tx 트랜잭션 클라이언트 (선택)
   * @returns 새로운 우선순위 번호
   */
  async getNextPriority(
    modelName: string,
    additionalWhere: Record<string, any>,
    tx?: any,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const model = client[modelName as keyof typeof client] as any;

    if (!model) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    const maxPriorityItem = await model.findFirst({
      where: { priority: { not: null }, ...additionalWhere },
      orderBy: { priority: 'desc' },
      select: { priority: true },
    });

    return maxPriorityItem ? maxPriorityItem.priority + 1 : 1;
  }
}
