# 병원 CRM 서버

NestJS + Prisma + PostgreSQL 기반의 병원 CRM 시스템 백엔드

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 설정

`.env.development`, `.env.test`, `.env.production` 파일을 생성하고 데이터베이스 연결 정보를 설정하세요.

### 3. Prisma 마이그레이션

```bash
# Prisma Client 생성
npm run prisma:generate

# 데이터베이스 마이그레이션 실행 (development)
npm run prisma:migrate

# 시드 데이터 추가 (선택사항)
npm run prisma:seed
```

### 4. 서버 실행

```bash
# 개발 모드 (자동으로 .env.development 로드)
npm run start:dev

# 테스트 모드 (자동으로 .env.test 로드)
npm run start:test

# 프로덕션 빌드 및 실행
npm run build
npm run start:prod
```

서버가 실행되면:

- **API**: http://localhost:3000
- **Swagger 문서**: http://localhost:3000/api-docs

## 📁 프로젝트 구조

```
server/
├── src/
│   ├── core/                      # 핵심 모듈
│   │   └── prisma/               # Prisma 설정
│   ├── modules/                   # 기능별 모듈
│   │   └── admin-visitor-setting/ # 관리자 방문자 설정
│   │       ├── dto/              # Data Transfer Objects
│   │       ├── admin-visitor-setting.controller.ts
│   │       ├── admin-visitor-setting.service.ts
│   │       ├── admin-visitor-setting.service.spec.ts
│   │       └── admin-visitor-setting.module.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── admin-visitor-setting.e2e-spec.ts
│   └── jest-e2e.json
├── prisma/
│   ├── schema.prisma             # 데이터베이스 스키마
│   ├── seed.ts                   # 시드 데이터
│   └── migrations/               # 마이그레이션 파일
├── .env.development              # 개발 환경 변수 (Git 제외)
├── .env.test                     # 테스트 환경 변수 (Git 제외)
├── .env.production               # 프로덕션 환경 변수 (Git 제외)
└── package.json
```

## 🧪 테스트

### Unit Tests

```bash
npm test                  # 모든 테스트 실행
npm run test:watch        # Watch 모드
npm run test:cov          # 커버리지 확인
```

### E2E Tests

```bash
npm run test:e2e
```

## 📊 API 엔드포인트

자세한 API 문서는 서버 실행 후 **Swagger UI**에서 확인하세요:

- http://localhost:3000/api-docs

### 방문자 등급 관리

| Method | Endpoint                                           | 설명             |
| ------ | -------------------------------------------------- | ---------------- |
| POST   | `/admin/visitor-settings/grades`                   | 등급 생성        |
| GET    | `/admin/visitor-settings/grades`                   | 모든 등급 조회   |
| GET    | `/admin/visitor-settings/grades/active`            | 활성 등급만 조회 |
| GET    | `/admin/visitor-settings/grades/:id`               | 특정 등급 조회   |
| PUT    | `/admin/visitor-settings/grades/:id`               | 등급 수정        |
| DELETE | `/admin/visitor-settings/grades/:id`               | 등급 삭제        |
| PUT    | `/admin/visitor-settings/grades/:id/toggle-active` | 활성화 토글      |

## 🔧 Prisma 유틸리티

### 개발 환경

```bash
npm run prisma:studio       # 데이터베이스 GUI
npm run prisma:migrate      # 마이그레이션 실행
npm run prisma:seed         # 시드 데이터 추가
```

### 테스트 환경

```bash
npm run prisma:studio:test
npm run prisma:migrate:test
npm run prisma:seed:test
```

### 프로덕션 환경

```bash
npm run prisma:migrate:prod  # 프로덕션 마이그레이션
```

### 스키마 변경 시

```bash
# 1. prisma/schema.prisma 수정
# 2. 마이그레이션 생성
NODE_ENV=development npx prisma migrate dev --name 변경사항_설명
```

## 🌍 환경별 실행

프로젝트는 `NODE_ENV` 환경 변수에 따라 자동으로 적절한 `.env` 파일을 로드합니다:

- `development` → `.env.development`
- `test` → `.env.test`
- `production` → `.env.production`

서버 시작 시 콘솔에 현재 환경이 표시됩니다:

```
📌 Environment: development
🚀 Server is running on: http://localhost:3000
```

## 📝 개발 가이드

### 새 모듈 추가

```bash
# NestJS CLI로 모듈 생성
nest g module modules/모듈명
nest g controller modules/모듈명
nest g service modules/모듈명

# Prisma 스키마 수정 후
npm run prisma:migrate
```

### 테스트 작성 우선순위

1. **필수**: 비즈니스 로직 (Service) - `.spec.ts`
2. **중요**: API 엔드포인트 (E2E) - `.e2e-spec.ts`
3. **선택**: Controller (E2E로 대부분 커버됨)

## 🛠️ 기술 스택

- **Framework**: NestJS 10.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **Language**: TypeScript 5.x

## 🔒 보안

- `.env` 파일들은 절대 Git에 커밋하지 마세요
- 프로덕션 환경에서는 강력한 JWT_SECRET 사용
- CORS 및 Rate limiting 설정 권장

## 📄 라이선스

MIT
