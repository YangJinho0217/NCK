import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { format } from 'sql-formatter';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const connectionString = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    const enableLog = configService.get<string>('ENABLE_QUERY_LOG') === 'true';

    super({
      adapter,
      log: enableLog
        ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ]
        : process.env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
    });

    if (enableLog) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        this.logQuery(e);
      });
    }
  }

  /**
   * 쿼리 로그를 깔끔하게 포맷팅하여 출력
   */
  private logQuery(e: Prisma.QueryEvent) {
    const params = this.formatParams(e.params);
    const formattedQuery = this.formatSql(e.query);
    const duration = e.duration;

    // 실행 시간에 따른 색상/아이콘 구분
    const durationIcon = duration > 1000 ? '🐢' : duration > 100 ? '⚡' : '✨';
    const durationColor = duration > 1000 ? '\x1b[31m' : duration > 100 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';

    const logMessage = `
┌─────────────────────────────────────────────────────────────────
│ ${durationIcon} QUERY ${durationColor}(${duration}ms)${reset}
├─────────────────────────────────────────────────────────────────
│ 📝 SQL:
${formattedQuery
        .split('\n')
        .map((line) => `│   ${line}`)
        .join('\n')}
├─────────────────────────────────────────────────────────────────
│ 📦 Parameters:
${params
        .split('\n')
        .map((line) => `│   ${line}`)
        .join('\n')}
└─────────────────────────────────────────────────────────────────`;

    this.logger.info(logMessage);
  }

  /**
   * SQL 쿼리를 보기 좋게 포맷팅
   */
  private formatSql(query: string): string {
    try {
      const formatted = format(query, {
        language: 'postgresql',
        tabWidth: 2,
        keywordCase: 'upper',
        linesBetweenQueries: 1,
      });

      if (!formatted.includes('\n')) {
        return this.manualFormatSql(query);
      }

      return formatted;
    } catch {
      return this.manualFormatSql(query);
    }
  }

  /**
   * sql-formatter 실패 시 수동 포맷팅
   */
  private manualFormatSql(query: string): string {
    let formatted = query.replace(/"public"\./g, '');

    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'RETURNING', 'ON', 'AS'];

    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\s+${keyword}\\s+`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword} `);
    });

    formatted = formatted.replace(/\(([^)]+)\)\s*VALUES/gi, (match, columns) => {
      const cols = columns.split(',').map((c: string) => c.trim());
      if (cols.length > 3) {
        return `(\n    ${cols.join(',\n    ')}\n  )\nVALUES`;
      }
      return match;
    });

    formatted = formatted.replace(/VALUES\s*\(([^)]+)\)/gi, (match, values) => {
      const vals = values.split(',').map((v: string) => v.trim());
      if (vals.length > 3) {
        return `VALUES (\n    ${vals.join(',\n    ')}\n  )`;
      }
      return match;
    });

    formatted = formatted.replace(/RETURNING\s+(.+)$/gi, (match, columns) => {
      const cols = columns.split(',').map((c: string) => c.trim().replace(/"public"\./g, ''));
      if (cols.length > 2) {
        return `RETURNING\n    ${cols.join(',\n    ')}`;
      }
      return `RETURNING ${cols.join(', ')}`;
    });

    formatted = formatted.replace(/  +/g, ' ');
    formatted = formatted
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    return formatted;
  }

  /**
   * 파라미터를 보기 좋게 포맷팅
   */
  private formatParams(params: string): string {
    try {
      const parsed = JSON.parse(params);
      if (Array.isArray(parsed) && parsed.length === 0) {
        return '(없음)';
      }

      if (Array.isArray(parsed)) {
        return parsed
          .map((param: unknown, idx: number) => {
            const value = this.formatParamValue(param);
            return `$${idx + 1}: ${value}`;
          })
          .join('\n');
      }

      return JSON.stringify(parsed, null, 2);
    } catch {
      return params || '(없음)';
    }
  }

  /**
   * 개별 파라미터 값을 타입에 맞게 포맷팅
   */
  private formatParamValue(value: unknown): string {
    if (value === null) return 'NULL';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return `[${value.map((v) => this.formatParamValue(v)).join(', ')}]`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.info('✅ Prisma DB Connection established successfully.', {
        context: 'PrismaService',
      });
    } catch (error) {
      this.logger.error('❌ Prisma DB Connection failed', {
        context: 'PrismaService',
        error,
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.info('Prisma DB Connection closed.', {
      context: 'PrismaService',
    });
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    const models = Reflect.ownKeys(this).filter((key) => key !== '_baseDmmf' && key !== '_engine' && key !== '_fetcher');

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as string];
        if (model && typeof model.deleteMany === 'function') {
          return model.deleteMany();
        }
      }),
    );
  }
}
