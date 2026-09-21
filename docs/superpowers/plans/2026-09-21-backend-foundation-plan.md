# GearVN Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo nền tảng NestJS monorepo chạy được sáu application shell, API
Gateway baseline và PostgreSQL multi-database bằng Docker Compose mà chưa sửa
frontend.

**Architecture:** `backend/` là một Nest CLI monorepo dùng chung dependency và
shared libraries. API Gateway expose port 4000; năm domain service chỉ chạy trên
Docker network; một PostgreSQL 17 container khởi tạo năm database độc lập.

**Tech Stack:** Node.js 22, Yarn 4.18, NestJS 12, TypeScript, Jest, Supertest,
Zod, Swagger/OpenAPI, Helmet, PostgreSQL 17, Docker Compose.

**Spec:**
`docs/superpowers/specs/2026-09-21-nestjs-microservices-backend-design.md`

## Global Constraints

- Chỉ tạo/sửa `backend/**`, `.gitignore` khi thật sự cần; không sửa runtime
  frontend trong `src/`.
- API Gateway là app duy nhất expose host port.
- Chưa cài Prisma trong foundation; từng domain plan sẽ thêm Prisma schema/client
  riêng.
- Chưa cài RabbitMQ vì scope hiện tại chưa có async consumer bắt buộc.
- Dùng `.env.example`; không commit `.env`.
- Dùng `yarn.cmd` trên Windows nếu PowerShell chặn `yarn.ps1`.
- Mọi HTTP app dùng validation, request ID và error envelope chung.
- Không dùng `latest` trong committed dependencies; scaffold xong phải giữ exact
  major và lockfile.

## Review Focus

- Thiếu hoặc sai `PORT` phải làm app dừng khi startup với lỗi config rõ ràng;
  Task 2 khóa hành vi bằng unit test.
- Client gửi `x-request-id` rỗng/quá dài phải nhận request ID mới thay vì làm bẩn
  log; Task 3 khóa bằng test middleware.
- Unknown DTO property phải bị từ chối thay vì âm thầm đi qua; Task 3 khóa bằng
  E2E validation test.
- PostgreSQL volume mới phải có đủ năm database; Task 6 kiểm tra bằng script
  truy vấn `pg_database`.
- Compose không được publish port của domain service; Task 7 kiểm tra rendered
  Compose config và host health behavior.

---

## File map cuối Plan 1

```text
backend/
  apps/
    api-gateway/src/
    identity-service/src/
    catalog-service/src/
    cart-service/src/
    order-service/src/
    chat-service/src/
  libs/
    config/src/
      env.ts
      config.module.ts
    common/src/
      errors/api-error.filter.ts
      health/health.controller.ts
      health/health.module.ts
      http/request-id.middleware.ts
      bootstrap-http-app.ts
  docker/postgres/init/001-create-databases.sql
  scripts/verify-foundation.ps1
  test/
    setup-env.ts
    env.spec.ts
    request-id.middleware.spec.ts
    api-gateway.e2e-spec.ts
    service-shells.e2e-spec.ts
  .dockerignore
  .env.example
  .yarnrc.yml
  compose.yaml
  Dockerfile
  jest.config.ts
  nest-cli.json
  package.json
  tsconfig.json
  yarn.lock
```

---

### Task 1: Scaffold NestJS monorepo và khóa workspace contract

**Files:**
- Create: `backend/package.json`
- Create: `backend/yarn.lock`
- Create: `backend/.yarnrc.yml`
- Create: `backend/nest-cli.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/jest.config.ts`
- Create: `backend/apps/*/tsconfig.app.json`
- Create: `backend/apps/*/src/app.module.ts`
- Create: `backend/apps/*/src/main.ts`
- Create: `backend/libs/config/**`
- Create: `backend/libs/common/**`
- Create: `backend/libs/contracts/**`
- Create: `backend/libs/auth/**`
- Create: `backend/test/setup-env.ts`
- Test: `backend/test/workspace-structure.spec.ts`

**Interfaces:**
- Consumes: Yarn 4.18 từ repository và Node.js 22.
- Produces: sáu Nest application project có tên chính xác `api-gateway`,
  `identity-service`, `catalog-service`, `cart-service`, `order-service`,
  `chat-service`; bốn library alias `@app/config`, `@app/common`,
  `@app/contracts`, `@app/auth`.

- [ ] **Step 1: Kiểm tra toolchain trước scaffold**

Run từ repository root:

```powershell
node --version
yarn.cmd --version
docker version
docker compose version
```

Expected: Node major `22`, Yarn `4.18.x`, Docker có cả Client và Server, Compose
trả version. Nếu Docker Server chưa chạy, mở Docker Desktop trước khi đến Task 6.

**Giải thích:** Node/Yarn khác major có thể tạo lockfile hoặc Nest output khác
plan. Không tiếp tục bằng npm nếu plan đã chọn Yarn.

- [ ] **Step 2: Tạo Nest standard project làm nguồn chuyển đổi monorepo**

Run từ repository root:

```powershell
yarn.cmd dlx @nestjs/cli@12 new backend --package-manager yarn --strict --skip-git
Set-Location -LiteralPath backend
```

Khi CLI hỏi telemetry, chọn theo ý người dùng; lựa chọn này không ảnh hưởng source.

- [ ] **Step 3: Chuyển sang Nest monorepo và tạo application/library projects**

Run trong `backend/`:

```powershell
yarn.cmd nest generate app api-gateway
yarn.cmd nest generate app identity-service
yarn.cmd nest generate app catalog-service
yarn.cmd nest generate app cart-service
yarn.cmd nest generate app order-service
yarn.cmd nest generate app chat-service
yarn.cmd nest generate library config
yarn.cmd nest generate library common
yarn.cmd nest generate library contracts
yarn.cmd nest generate library auth
```

Nest CLI chuyển project standard ban đầu thành monorepo khi app đầu tiên được
generate. Đây là behavior chính thức của Nest workspace; không tự tạo sáu
`package.json` vì Nest monorepo dùng dependency/config chung.

Nếu CLI hỏi library prefix, nhập `@app` để aliases khớp `@app/config`,
`@app/common`, `@app/contracts` và `@app/auth` trong plan.

- [ ] **Step 4: Xóa app scaffold tạm và chuẩn hóa project mặc định**

Sau conversion, app gốc tên `backend` chỉ là scaffold tạm. Xóa đúng thư mục:

```powershell
Remove-Item -LiteralPath 'apps/backend' -Recurse -Force
```

Sửa `nest-cli.json` để bỏ entry `backend` và đặt các top-level field:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/api-gateway/src",
  "monorepo": true,
  "root": "apps/api-gateway",
  "compilerOptions": {
    "deleteOutDir": true,
    "builder": "rspack",
    "tsConfigPath": "apps/api-gateway/tsconfig.app.json"
  },
  "projects": {
    "api-gateway": {
      "type": "application",
      "root": "apps/api-gateway",
      "entryFile": "main",
      "sourceRoot": "apps/api-gateway/src",
      "compilerOptions": {
        "tsConfigPath": "apps/api-gateway/tsconfig.app.json"
      }
    },
    "identity-service": {
      "type": "application",
      "root": "apps/identity-service",
      "entryFile": "main",
      "sourceRoot": "apps/identity-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/identity-service/tsconfig.app.json"
      }
    },
    "catalog-service": {
      "type": "application",
      "root": "apps/catalog-service",
      "entryFile": "main",
      "sourceRoot": "apps/catalog-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/catalog-service/tsconfig.app.json"
      }
    },
    "cart-service": {
      "type": "application",
      "root": "apps/cart-service",
      "entryFile": "main",
      "sourceRoot": "apps/cart-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/cart-service/tsconfig.app.json"
      }
    },
    "order-service": {
      "type": "application",
      "root": "apps/order-service",
      "entryFile": "main",
      "sourceRoot": "apps/order-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/order-service/tsconfig.app.json"
      }
    },
    "chat-service": {
      "type": "application",
      "root": "apps/chat-service",
      "entryFile": "main",
      "sourceRoot": "apps/chat-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/chat-service/tsconfig.app.json"
      }
    },
    "config": {
      "type": "library",
      "root": "libs/config",
      "entryFile": "index",
      "sourceRoot": "libs/config/src",
      "compilerOptions": { "tsConfigPath": "libs/config/tsconfig.lib.json" }
    },
    "common": {
      "type": "library",
      "root": "libs/common",
      "entryFile": "index",
      "sourceRoot": "libs/common/src",
      "compilerOptions": { "tsConfigPath": "libs/common/tsconfig.lib.json" }
    },
    "contracts": {
      "type": "library",
      "root": "libs/contracts",
      "entryFile": "index",
      "sourceRoot": "libs/contracts/src",
      "compilerOptions": { "tsConfigPath": "libs/contracts/tsconfig.lib.json" }
    },
    "auth": {
      "type": "library",
      "root": "libs/auth",
      "entryFile": "index",
      "sourceRoot": "libs/auth/src",
      "compilerOptions": { "tsConfigPath": "libs/auth/tsconfig.lib.json" }
    }
  }
}
```

**Lưu ý:** Giữ Rspack cho Nest monorepo để shared library aliases được bundle
đúng vào từng application. Chuyển sang `tsc` mà không thêm runtime alias resolver
có thể build thành công nhưng lỗi `Cannot find module '@app/...'` khi chạy.

- [ ] **Step 5: Cấu hình Yarn node-modules linker**

Tạo `backend/.yarnrc.yml`:

```yaml
nodeLinker: node-modules
```

Run:

```powershell
yarn.cmd install
```

**Lưu ý:** Key phải viết đúng `nodeLinker`; sai casing có thể khiến Yarn bỏ qua.

- [ ] **Step 6: Viết workspace structure test**

Tạo `backend/test/workspace-structure.spec.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Nest workspace", () => {
  it("declares the six backend applications", () => {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), "nest-cli.json"), "utf8"),
    ) as { projects: Record<string, { type: string }> };

    const applications = Object.entries(config.projects)
      .filter(([, project]) => project.type === "application")
      .map(([name]) => name)
      .sort();

    expect(applications).toEqual([
      "api-gateway",
      "cart-service",
      "catalog-service",
      "chat-service",
      "identity-service",
      "order-service",
    ]);
  });
});
```

Tạo `backend/jest.config.ts`:

```ts
import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.(spec|e2e-spec)\\.ts$",
  transform: { "^.+\\.(t|j)s$": "ts-jest" },
  collectCoverageFrom: ["apps/**/*.ts", "libs/**/*.ts"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/libs/$1/src",
  },
};

export default config;
```

Tạo `backend/test/setup-env.ts` để environment hợp lệ tồn tại trước khi Jest
import bất kỳ Nest module nào:

```ts
process.env.NODE_ENV = "test";
process.env.SERVICE_NAME = "test-service";
process.env.PORT = "4100";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
```

**Lưu ý:** `ConfigModule.forRoot()` có thể validate ngay lúc module được import.
Set environment trong `beforeAll` là quá muộn đối với những test có static
`AppModule` import.

Trong `backend/package.json`, chuẩn hóa scripts:

```json
{
  "scripts": {
    "build": "nest build api-gateway",
    "build:all": "nest build api-gateway && nest build identity-service && nest build catalog-service && nest build cart-service && nest build order-service && nest build chat-service",
    "start:gateway:dev": "nest start api-gateway --watch",
    "lint": "eslint \"{apps,libs,test}/**/*.ts\"",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:e2e": "jest --runInBand --testRegex=.*\\.e2e-spec\\.ts$"
  }
}
```

- [ ] **Step 7: Chạy test và build workspace**

Run:

```powershell
yarn.cmd test --runTestsByPath test/workspace-structure.spec.ts
yarn.cmd build:all
```

Expected: test PASS; cả sáu app build exit `0`.

- [ ] **Step 8: Commit workspace scaffold**

```powershell
git add backend
git diff --cached --check
git commit -m "chore: scaffold NestJS backend workspace"
```

---

### Task 2: Shared environment validation

**Files:**
- Modify: `backend/package.json`
- Create: `backend/libs/config/src/env.ts`
- Create: `backend/libs/config/src/config.module.ts`
- Modify: `backend/libs/config/src/index.ts`
- Test: `backend/test/env.spec.ts`

**Interfaces:**
- Consumes: Nest `ConfigModule` and raw `process.env` values.
- Produces: `validateBaseEnv(raw): BaseEnv` and `BackendConfigModule` used by all
  application modules.

- [ ] **Step 1: Cài configuration dependencies**

Run trong `backend/`:

```powershell
yarn.cmd add @nestjs/config zod
```

- [ ] **Step 2: Viết failing environment tests**

Tạo `backend/test/env.spec.ts`:

```ts
import { validateBaseEnv } from "@app/config";

describe("validateBaseEnv", () => {
  it("coerces a valid port", () => {
    expect(
      validateBaseEnv({
        NODE_ENV: "test",
        SERVICE_NAME: "api-gateway",
        PORT: "4000",
        FRONTEND_ORIGIN: "http://localhost:3000",
      }),
    ).toMatchObject({ PORT: 4000 });
  });

  it("rejects a missing service name", () => {
    expect(() =>
      validateBaseEnv({
        NODE_ENV: "test",
        PORT: "4000",
        FRONTEND_ORIGIN: "http://localhost:3000",
      }),
    ).toThrow("SERVICE_NAME");
  });

  it("rejects an invalid port", () => {
    expect(() =>
      validateBaseEnv({
        NODE_ENV: "test",
        SERVICE_NAME: "api-gateway",
        PORT: "70000",
        FRONTEND_ORIGIN: "http://localhost:3000",
      }),
    ).toThrow("PORT");
  });

  it("keeps service-specific values for stricter validation downstream", () => {
    expect(
      validateBaseEnv({
        NODE_ENV: "test",
        SERVICE_NAME: "identity-service",
        PORT: "4001",
        FRONTEND_ORIGIN: "http://localhost:3000",
        DATABASE_URL: "postgresql://example",
      }).DATABASE_URL,
    ).toBe("postgresql://example");
  });
});
```

- [ ] **Step 3: Chạy test để xác nhận fail**

```powershell
yarn.cmd test --runTestsByPath test/env.spec.ts
```

Expected: FAIL vì `validateBaseEnv` chưa được export.

- [ ] **Step 4: Implement environment schema**

Tạo `backend/libs/config/src/env.ts`:

```ts
import { z } from "zod";

export const baseEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    SERVICE_NAME: z.string().trim().min(1),
    PORT: z.coerce.number().int().min(1024).max(65535),
    FRONTEND_ORIGIN: z.string().url(),
  })
  .passthrough();

export type BaseEnv = z.infer<typeof baseEnvSchema>;

export function validateBaseEnv(raw: Record<string, unknown>): BaseEnv {
  const result = baseEnvSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(`Invalid environment: ${result.error.message}`);
  }

  return result.data;
}
```

Tạo `backend/libs/config/src/config.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateBaseEnv } from "./env";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateBaseEnv,
    }),
  ],
  exports: [ConfigModule],
})
export class BackendConfigModule {}
```

Export trong `backend/libs/config/src/index.ts`:

```ts
export * from "./config.module";
export * from "./env";
```

**Giải thích:** Validate lúc startup giúp service fail-fast; lỗi config không bị
trì hoãn tới request đầu tiên.

- [ ] **Step 5: Chạy test và build**

```powershell
yarn.cmd test --runTestsByPath test/env.spec.ts
yarn.cmd build:all
```

Expected: 4 tests PASS; build exit `0`.

- [ ] **Step 6: Commit config contract**

```powershell
git add backend/package.json backend/yarn.lock backend/libs/config backend/test/env.spec.ts
git diff --cached --check
git commit -m "feat: validate backend environment configuration"
```

---

### Task 3: Request ID, validation pipe và error envelope

**Files:**
- Create: `backend/libs/common/src/http/request-id.middleware.ts`
- Create: `backend/libs/common/src/errors/api-error.ts`
- Create: `backend/libs/common/src/errors/api-error.filter.ts`
- Create: `backend/libs/common/src/bootstrap-http-app.ts`
- Modify: `backend/libs/common/src/index.ts`
- Test: `backend/test/request-id.middleware.spec.ts`
- Test: `backend/test/api-error.filter.spec.ts`

**Interfaces:**
- Consumes: Express request/response and Nest `HttpException`.
- Produces: `RequestIdMiddleware`, `ApiError`, `ApiErrorFilter` và
  `configureHttpApp(app, options)`.

- [ ] **Step 1: Cài HTTP foundation dependencies**

```powershell
yarn.cmd add class-transformer class-validator helmet
```

- [ ] **Step 2: Viết failing request ID tests**

Tạo `backend/test/request-id.middleware.spec.ts`:

```ts
import type { Response } from "express";

import { RequestIdMiddleware, type RequestWithId } from "@app/common";

function createResponse() {
  const headers = new Map<string, string>();
  return {
    headers,
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
  };
}

describe("RequestIdMiddleware", () => {
  const middleware = new RequestIdMiddleware();

  it("preserves a valid request id", () => {
    const request = {
      headers: { "x-request-id": "req-client-123" },
    } as unknown as RequestWithId;
    const response = createResponse();

    middleware.use(request, response as unknown as Response, () => undefined);

    expect(request.requestId).toBe("req-client-123");
    expect(response.headers.get("x-request-id")).toBe("req-client-123");
  });

  it.each(["", "x".repeat(129)])(
    "replaces an invalid request id",
    (incoming) => {
      const request = {
        headers: { "x-request-id": incoming },
      } as unknown as RequestWithId;
      const response = createResponse();

      middleware.use(request, response as unknown as Response, () => undefined);

      expect(request.requestId).toMatch(/^[0-9a-f-]{36}$/);
    },
  );
});
```

- [ ] **Step 3: Chạy request ID test để xác nhận fail**

```powershell
yarn.cmd test --runTestsByPath test/request-id.middleware.spec.ts
```

Expected: FAIL vì `RequestIdMiddleware` chưa tồn tại.

- [ ] **Step 4: Implement request ID middleware**

Tạo `backend/libs/common/src/http/request-id.middleware.ts`:

```ts
import { randomUUID } from "node:crypto";

import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

export type RequestWithId = Request & { requestId: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const incoming = request.headers["x-request-id"];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
    const requestId =
      typeof candidate === "string" &&
      candidate.trim().length > 0 &&
      candidate.length <= 128
        ? candidate
        : randomUUID();

    request.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    next();
  }
}
```

- [ ] **Step 5: Viết failing error mapping tests**

Tạo `backend/test/api-error.filter.spec.ts`:

```ts
import { HttpStatus } from "@nestjs/common";

import { ApiError } from "@app/common";

describe("ApiError", () => {
  it("keeps a stable public code and details", () => {
    const error = new ApiError(
      HttpStatus.CONFLICT,
      "RESOURCE_CONFLICT",
      "Tài nguyên đã tồn tại.",
      [{ field: "email", issue: "duplicate" }],
    );

    expect(error.getStatus()).toBe(409);
    expect(error.getResponse()).toEqual({
      code: "RESOURCE_CONFLICT",
      message: "Tài nguyên đã tồn tại.",
      details: [{ field: "email", issue: "duplicate" }],
    });
  });
});
```

Run và expected FAIL:

```powershell
yarn.cmd test --runTestsByPath test/api-error.filter.spec.ts
```

- [ ] **Step 6: Implement public error type và global filter**

Tạo `backend/libs/common/src/errors/api-error.ts`:

```ts
import { HttpException } from "@nestjs/common";

export type ApiErrorDetail = {
  field?: string;
  issue: string;
};

export class ApiError extends HttpException {
  constructor(
    statusCode: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
  ) {
    super({ code, message, details }, statusCode);
  }
}
```

Tạo `backend/libs/common/src/errors/api-error.filter.ts`:

```ts
import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";

import type { RequestWithId } from "../http/request-id.middleware";

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body =
      typeof raw === "object" && raw !== null
        ? (raw as Record<string, unknown>)
        : {};

    if (statusCode >= 500) {
      this.logger.error({
        requestId: request.requestId,
        path: request.url,
        exception,
      });
    }

    response.status(statusCode).json({
      statusCode,
      code:
        typeof body.code === "string"
          ? body.code
          : statusCode === 400
            ? "VALIDATION_ERROR"
            : statusCode >= 500
              ? "INTERNAL_ERROR"
              : "HTTP_ERROR",
      message:
        statusCode >= 500
          ? "Hệ thống đang gặp sự cố. Vui lòng thử lại sau."
          : typeof body.message === "string"
            ? body.message
            : "Yêu cầu không hợp lệ.",
      requestId: request.requestId,
      details: Array.isArray(body.details) ? body.details : [],
    });
  }
}
```

- [ ] **Step 7: Implement shared HTTP bootstrap**

Tạo `backend/libs/common/src/bootstrap-http-app.ts`:

```ts
import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";

import { ApiErrorFilter } from "./errors/api-error.filter";

type HttpAppOptions = {
  frontendOrigin: string;
  globalPrefix?: string;
};

export function configureHttpApp(
  app: INestApplication,
  options: HttpAppOptions,
): void {
  app.use(helmet());
  app.enableCors({
    origin: options.frontendOrigin,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ApiErrorFilter());

  if (options.globalPrefix) {
    app.setGlobalPrefix(options.globalPrefix);
  }
}
```

Export `ApiError`, `ApiErrorFilter`, `RequestIdMiddleware`, `RequestWithId` và
`configureHttpApp` trong `backend/libs/common/src/index.ts`.

- [ ] **Step 8: Chạy tests và build**

```powershell
yarn.cmd test --runTestsByPath test/request-id.middleware.spec.ts test/api-error.filter.spec.ts
yarn.cmd build:all
```

Expected: tests PASS; build exit `0`.

- [ ] **Step 9: Commit HTTP foundation**

```powershell
git add backend/package.json backend/yarn.lock backend/libs/common backend/test
git diff --cached --check
git commit -m "feat: add shared HTTP error and request contracts"
```

---

### Task 4: API Gateway health, validation, Swagger và rate limit

**Files:**
- Modify: `backend/package.json`
- Create: `backend/apps/api-gateway/src/health.controller.ts`
- Create: `backend/apps/api-gateway/src/probe.dto.ts`
- Create: `backend/apps/api-gateway/src/probe.controller.ts`
- Modify: `backend/apps/api-gateway/src/app.module.ts`
- Modify: `backend/apps/api-gateway/src/main.ts`
- Test: `backend/test/api-gateway.e2e-spec.ts`

**Interfaces:**
- Consumes: `BackendConfigModule`, `RequestIdMiddleware`, `configureHttpApp`.
- Produces: public `/api/health/live`, `/api/health/ready`, `/api/probe` và
  `/docs` OpenAPI page on port 4000.

- [ ] **Step 1: Cài Gateway dependencies**

```powershell
yarn.cmd add @nestjs/swagger @nestjs/throttler
yarn.cmd add --dev supertest @types/supertest
```

- [ ] **Step 2: Viết failing Gateway E2E test**

Tạo `backend/test/api-gateway.e2e-spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { configureHttpApp } from "@app/common";
import { AppModule } from "../apps/api-gateway/src/app.module";

describe("API Gateway (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureHttpApp(app, {
      frontendOrigin: "http://localhost:3000",
      globalPrefix: "api",
    });
    await app.init();
  });

  afterAll(() => app.close());

  it("returns liveness with a request id", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/health/live")
      .expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      service: "api-gateway",
    });
    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("rejects unknown DTO fields", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/probe")
      .send({ value: "ok", injected: "blocked" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
```

- [ ] **Step 3: Chạy E2E để xác nhận fail**

```powershell
yarn.cmd test --runTestsByPath test/api-gateway.e2e-spec.ts
```

Expected: FAIL vì health/probe routes chưa tồn tại.

- [ ] **Step 4: Implement controllers và DTO**

Tạo `backend/apps/api-gateway/src/health.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get("live")
  live() {
    return { status: "ok", service: "api-gateway" };
  }

  @Get("ready")
  ready() {
    return { status: "ready", service: "api-gateway" };
  }
}
```

Tạo `backend/apps/api-gateway/src/probe.dto.ts`:

```ts
import { IsString, MinLength } from "class-validator";

export class ProbeDto {
  @IsString()
  @MinLength(1)
  value!: string;
}
```

Thêm controller probe vào cùng file health hoặc tạo `probe.controller.ts`:

```ts
import { Body, Controller, Post } from "@nestjs/common";

import { ProbeDto } from "./probe.dto";

@Controller("probe")
export class ProbeController {
  @Post()
  probe(@Body() body: ProbeDto) {
    return body;
  }
}
```

- [ ] **Step 5: Cấu hình Gateway module và request ID middleware**

Thay nội dung `backend/apps/api-gateway/src/app.module.ts`:

```ts
import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { RequestIdMiddleware } from "@app/common";
import { BackendConfigModule } from "@app/config";

import { HealthController } from "./health.controller";
import { ProbeController } from "./probe.controller";

@Module({
  imports: [
    BackendConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
  ],
  controllers: [HealthController, ProbeController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
```

Global `ThrottlerGuard` áp dụng baseline 120 request/phút. Identity plan sẽ đặt
policy chặt hơn cho login/register bằng decorator riêng.

- [ ] **Step 6: Cấu hình bootstrap và Swagger**

Thay `backend/apps/api-gateway/src/main.ts`:

```ts
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { configureHttpApp } from "@app/common";
import type { BaseEnv } from "@app/config";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<BaseEnv, true>);

  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true }),
    globalPrefix: "api",
  });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("GearVN Backend API")
      .setDescription("Public API Gateway contract")
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("docs", app, document);

  await app.listen(config.get("PORT", { infer: true }));
}

void bootstrap();
```

**Lưu ý:** Với global prefix, xác nhận Swagger thực tế ở `/docs`; không tự ghép
thành `/api/docs` nếu bootstrap đang setup `docs` ngoài controller routing.

- [ ] **Step 7: Chạy E2E, build và smoke run**

```powershell
yarn.cmd test --runTestsByPath test/api-gateway.e2e-spec.ts
yarn.cmd build:all
$env:NODE_ENV='development'
$env:SERVICE_NAME='api-gateway'
$env:PORT='4000'
$env:FRONTEND_ORIGIN='http://localhost:3000'
yarn.cmd nest start api-gateway
```

Trong terminal khác:

```powershell
Invoke-RestMethod http://localhost:4000/api/health/live
Invoke-WebRequest http://localhost:4000/docs
```

Expected: health trả `status=ok`; Swagger trả HTTP 200. Dừng process bằng
`Ctrl+C`, sau đó xóa bốn environment variable khỏi terminal nếu cần.

- [ ] **Step 8: Commit Gateway baseline**

```powershell
git add backend
git diff --cached --check
git commit -m "feat: add API Gateway foundation"
```

---

### Task 5: Domain service health shells

**Files:**
- Create: `backend/libs/common/src/health/health.controller.ts`
- Create: `backend/libs/common/src/health/health.module.ts`
- Modify: `backend/libs/common/src/index.ts`
- Modify: `backend/apps/{identity,catalog,cart,order,chat}-service/src/app.module.ts`
- Modify: `backend/apps/{identity,catalog,cart,order,chat}-service/src/main.ts`
- Test: `backend/test/service-shells.e2e-spec.ts`

**Interfaces:**
- Consumes: `BackendConfigModule`, `RequestIdMiddleware`, `configureHttpApp`.
- Produces: internal `/health/live` và `/health/ready` cho năm domain service.

- [ ] **Step 1: Viết failing service shell E2E test**

Tạo `backend/test/service-shells.e2e-spec.ts`:

```ts
import type { INestApplication, Type } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { configureHttpApp } from "@app/common";
import { AppModule as IdentityModule } from "../apps/identity-service/src/app.module";
import { AppModule as CatalogModule } from "../apps/catalog-service/src/app.module";
import { AppModule as CartModule } from "../apps/cart-service/src/app.module";
import { AppModule as OrderModule } from "../apps/order-service/src/app.module";
import { AppModule as ChatModule } from "../apps/chat-service/src/app.module";

const services: Array<[string, Type<unknown>]> = [
  ["identity-service", IdentityModule],
  ["catalog-service", CatalogModule],
  ["cart-service", CartModule],
  ["order-service", OrderModule],
  ["chat-service", ChatModule],
];

describe.each(services)("%s shell", (serviceName, moduleType) => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [moduleType],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get(key: string) {
          const values: Record<string, string | number> = {
            NODE_ENV: "test",
            SERVICE_NAME: serviceName,
            PORT: 4100,
            FRONTEND_ORIGIN: "http://localhost:3000",
          };
          return values[key];
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    configureHttpApp(app, {
      frontendOrigin: "http://localhost:3000",
    });
    await app.init();
  });

  afterAll(() => app.close());

  it("reports liveness", async () => {
    const response = await request(app.getHttpServer())
      .get("/health/live")
      .expect(200);
    expect(response.body).toEqual({ status: "ok", service: serviceName });
  });
});
```

- [ ] **Step 2: Chạy E2E để xác nhận fail**

```powershell
yarn.cmd test --runTestsByPath test/service-shells.e2e-spec.ts
```

Expected: FAIL vì domain apps chưa import shared health module.

- [ ] **Step 3: Implement shared health module**

Tạo `backend/libs/common/src/health/health.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { BaseEnv } from "@app/config";

@Controller("health")
export class HealthController {
  constructor(private readonly config: ConfigService<BaseEnv, true>) {}

  @Get("live")
  live() {
    return {
      status: "ok",
      service: this.config.get("SERVICE_NAME", { infer: true }),
    };
  }

  @Get("ready")
  ready() {
    return {
      status: "ready",
      service: this.config.get("SERVICE_NAME", { infer: true }),
    };
  }
}
```

Tạo `backend/libs/common/src/health/health.module.ts`:

```ts
import { Module } from "@nestjs/common";

import { HealthController } from "./health.controller";

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

Export `HealthModule` trong `backend/libs/common/src/index.ts`.

- [ ] **Step 4: Cấu hình năm domain AppModule**

Ghi đúng đoạn code sau vào cả năm file:

- `backend/apps/identity-service/src/app.module.ts`
- `backend/apps/catalog-service/src/app.module.ts`
- `backend/apps/cart-service/src/app.module.ts`
- `backend/apps/order-service/src/app.module.ts`
- `backend/apps/chat-service/src/app.module.ts`

```ts
import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";

import { HealthModule, RequestIdMiddleware } from "@app/common";
import { BackendConfigModule } from "@app/config";

@Module({
  imports: [BackendConfigModule, HealthModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
```

Xóa generated `app.controller.ts`, `app.service.ts` và spec tương ứng sau khi
AppModule không còn import chúng.

- [ ] **Step 5: Cấu hình năm domain main.ts**

Ghi đúng đoạn code sau vào năm file `main.ts` tương ứng trong các app
`identity-service`, `catalog-service`, `cart-service`, `order-service` và
`chat-service`:

```ts
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";

import { configureHttpApp } from "@app/common";
import type { BaseEnv } from "@app/config";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<BaseEnv, true>);

  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true }),
  });

  await app.listen(config.get("PORT", { infer: true }));
}

void bootstrap();
```

**Giải thích:** Domain service không dùng global `/api` prefix vì các route này
chỉ là internal contract. Gateway chịu trách nhiệm public URL.

- [ ] **Step 6: Chạy tests và build toàn workspace**

```powershell
yarn.cmd test --runTestsByPath test/service-shells.e2e-spec.ts
yarn.cmd test
yarn.cmd build:all
```

Expected: năm parameterized health tests PASS; full tests và build exit `0`.

- [ ] **Step 7: Commit service shells**

```powershell
git add backend
git diff --cached --check
git commit -m "feat: add backend service health shells"
```

---

### Task 6: PostgreSQL multi-database local infrastructure

**Files:**
- Create: `backend/.env.example`
- Create: `backend/compose.yaml`
- Create: `backend/docker/postgres/init/001-create-databases.sql`
- Create: `backend/scripts/verify-databases.ps1`

**Interfaces:**
- Consumes: Docker Compose và PostgreSQL official image.
- Produces: `identity_db`, `catalog_db`, `cart_db`, `order_db`, `chat_db` trên
  container `gearvn-backend-postgres`, host port mặc định 5433.

- [ ] **Step 1: Tạo environment example**

Tạo `backend/.env.example`:

```dotenv
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000

POSTGRES_USER=gearvn_backend
POSTGRES_PASSWORD=gearvn_backend_local_password
POSTGRES_PORT=5433

API_GATEWAY_PORT=4000
IDENTITY_SERVICE_PORT=4001
CATALOG_SERVICE_PORT=4002
CART_SERVICE_PORT=4003
ORDER_SERVICE_PORT=4004
CHAT_SERVICE_PORT=4005
```

Copy local file, không commit:

```powershell
Copy-Item -LiteralPath '.env.example' -Destination '.env'
```

- [ ] **Step 2: Tạo database initialization SQL**

Tạo `backend/docker/postgres/init/001-create-databases.sql`:

```sql
CREATE DATABASE identity_db;
CREATE DATABASE catalog_db;
CREATE DATABASE cart_db;
CREATE DATABASE order_db;
CREATE DATABASE chat_db;
```

**Lưu ý:** Script `/docker-entrypoint-initdb.d` chỉ chạy khi data directory mới.
Không xóa volume chỉ để chạy lại script nếu volume đang chứa dữ liệu cần giữ.

- [ ] **Step 3: Tạo Compose PostgreSQL service**

Tạo `backend/compose.yaml`:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: gearvn-backend-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "${POSTGRES_PORT:-5433}:5432"
    volumes:
      - gearvn_backend_postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test:
        ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d postgres"]
      interval: 5s
      timeout: 5s
      retries: 12

volumes:
  gearvn_backend_postgres_data:
```

- [ ] **Step 4: Viết database verification script trước khi start**

Tạo `backend/scripts/verify-databases.ps1`:

```powershell
$ErrorActionPreference = 'Stop'

$expectedDatabases = @(
  'identity_db',
  'catalog_db',
  'cart_db',
  'order_db',
  'chat_db'
)

$databaseList = docker compose exec -T postgres psql `
  -U $env:POSTGRES_USER `
  -d postgres `
  -Atc 'SELECT datname FROM pg_database;'

foreach ($databaseName in $expectedDatabases) {
  if ($databaseList -notcontains $databaseName) {
    throw "Missing PostgreSQL database: $databaseName"
  }
}

Write-Host 'All backend databases are present.'
```

**Lưu ý:** PowerShell process không tự load `.env`. Trước script, set
`$env:POSTGRES_USER` từ cùng giá trị trong `.env`, hoặc truyền trực tiếp trong
terminal.

- [ ] **Step 5: Validate và start fresh PostgreSQL**

Run trong `backend/`:

```powershell
docker compose config
docker compose up -d postgres
docker compose ps
$env:POSTGRES_USER='gearvn_backend'
powershell -ExecutionPolicy Bypass -File scripts/verify-databases.ps1
```

Expected: PostgreSQL status `healthy`; script in
`verify-databases.ps1` in `All backend databases are present.`

Nếu container dùng volume cũ không có năm database, trước khi xóa volume phải
xác nhận đây chỉ là volume backend development mới. Khi đã xác nhận:

```powershell
docker compose down
docker volume ls --filter name=gearvn_backend_postgres_data
docker volume rm backend_gearvn_backend_postgres_data
docker compose up -d postgres
```

Không chạy `docker compose down -v` khi chưa kiểm tra chính xác volume target.

- [ ] **Step 6: Commit PostgreSQL foundation**

```powershell
git add backend/.env.example backend/compose.yaml backend/docker backend/scripts
git diff --cached --check
git commit -m "chore: add backend PostgreSQL databases"
```

---

### Task 7: Dockerize sáu application shells

**Files:**
- Create: `backend/.dockerignore`
- Create: `backend/Dockerfile`
- Modify: `backend/compose.yaml`
- Create: `backend/scripts/verify-foundation.ps1`

**Interfaces:**
- Consumes: sáu buildable Nest apps và PostgreSQL Compose service.
- Produces: sáu application containers; host chỉ truy cập Gateway port 4000.

- [ ] **Step 1: Tạo Docker ignore**

Tạo `backend/.dockerignore`:

```dockerignore
node_modules
dist
coverage
.env
.git
*.log
```

- [ ] **Step 2: Tạo multi-stage Dockerfile**

Tạo `backend/Dockerfile`:

```dockerfile
FROM node:22-alpine AS dependencies
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

FROM dependencies AS build
ARG APP_NAME
COPY . .
RUN yarn nest build ${APP_NAME}

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
USER node
CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]
```

**Lưu ý:** `APP_NAME` phải trùng key trong `nest-cli.json`. Build output path
được xác nhận bằng `yarn.cmd build:all` trước khi build image.

- [ ] **Step 3: Thêm service blocks vào Compose**

Thêm vào `services` trong `backend/compose.yaml`:

```yaml
  api-gateway:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: api-gateway
    container_name: gearvn-api-gateway
    restart: unless-stopped
    environment:
      NODE_ENV: development
      SERVICE_NAME: api-gateway
      PORT: 4000
      FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}
    ports:
      - "${API_GATEWAY_PORT:-4000}:4000"
    healthcheck:
      test:
        ["CMD-SHELL", "node -e \"fetch('http://localhost:4000/api/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\""]
      interval: 5s
      timeout: 5s
      retries: 12

  identity-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: identity-service
    container_name: gearvn-identity-service
    restart: unless-stopped
    environment:
      NODE_ENV: development
      SERVICE_NAME: identity-service
      PORT: 4001
      FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}
    healthcheck:
      test:
        ["CMD-SHELL", "node -e \"fetch('http://localhost:4001/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\""]
      interval: 5s
      timeout: 5s
      retries: 12

  catalog-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: catalog-service
    container_name: gearvn-catalog-service
    restart: unless-stopped
    environment:
      NODE_ENV: development
      SERVICE_NAME: catalog-service
      PORT: 4002
      FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}
    healthcheck:
      test:
        ["CMD-SHELL", "node -e \"fetch('http://localhost:4002/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\""]
      interval: 5s
      timeout: 5s
      retries: 12

  cart-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: cart-service
    container_name: gearvn-cart-service
    restart: unless-stopped
    environment:
      NODE_ENV: development
      SERVICE_NAME: cart-service
      PORT: 4003
      FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}
    healthcheck:
      test:
        ["CMD-SHELL", "node -e \"fetch('http://localhost:4003/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\""]
      interval: 5s
      timeout: 5s
      retries: 12

  order-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: order-service
    container_name: gearvn-order-service
    restart: unless-stopped
    environment:
      NODE_ENV: development
      SERVICE_NAME: order-service
      PORT: 4004
      FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}
    healthcheck:
      test:
        ["CMD-SHELL", "node -e \"fetch('http://localhost:4004/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\""]
      interval: 5s
      timeout: 5s
      retries: 12

  chat-service:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: chat-service
    container_name: gearvn-chat-service
    restart: unless-stopped
    environment:
      NODE_ENV: development
      SERVICE_NAME: chat-service
      PORT: 4005
      FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}
    healthcheck:
      test:
        ["CMD-SHELL", "node -e \"fetch('http://localhost:4005/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\""]
      interval: 5s
      timeout: 5s
      retries: 12
```

Không thêm `ports` cho domain services. Docker Compose network vẫn cho Gateway
gọi hostname `identity-service:4001`, nhưng host Windows không truy cập trực tiếp.

**Chú ý YAML:** Healthcheck của mỗi service phải dùng đúng port nội bộ của chính
service đó. Copy nhầm port 4001 sang service khác khiến container luôn unhealthy
dù process đã chạy.

- [ ] **Step 4: Viết foundation verification script**

Tạo `backend/scripts/verify-foundation.ps1`:

```powershell
$ErrorActionPreference = 'Stop'

$gateway = Invoke-RestMethod 'http://localhost:4000/api/health/live'
if ($gateway.status -ne 'ok' -or $gateway.service -ne 'api-gateway') {
  throw 'API Gateway health check failed.'
}

$publishedPorts = docker compose config | Select-String -Pattern 'published:'
if (($publishedPorts | Measure-Object).Count -ne 2) {
  throw 'Only PostgreSQL and API Gateway may publish host ports.'
}

$env:POSTGRES_USER = 'gearvn_backend'
& "$PSScriptRoot/verify-databases.ps1"

Write-Host 'Backend foundation verification passed.'
```

Hai published ports là PostgreSQL development port và API Gateway. Domain
services không được xuất hiện trong danh sách `published:`.

- [ ] **Step 5: Build và start toàn bộ Compose stack**

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

Expected: bảy container `healthy` sau startup period.

- [ ] **Step 6: Chạy foundation verification**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-foundation.ps1
```

Expected: `Backend foundation verification passed.`

Xác nhận các port domain không public:

```powershell
Test-NetConnection localhost -Port 4001
Test-NetConnection localhost -Port 4002
Test-NetConnection localhost -Port 4003
Test-NetConnection localhost -Port 4004
Test-NetConnection localhost -Port 4005
```

Expected: `TcpTestSucceeded: False` cho cả năm. Port 4000 phải là `True`.

- [ ] **Step 7: Commit Docker application stack**

```powershell
git add backend/.dockerignore backend/Dockerfile backend/compose.yaml backend/scripts/verify-foundation.ps1
git diff --cached --check
git commit -m "chore: dockerize backend service shells"
```

---

### Task 8: Foundation documentation và acceptance gate

**Files:**
- Create: `backend/README.md`
- Modify: `backend/package.json`

**Interfaces:**
- Consumes: toàn bộ artifacts Task 1-7.
- Produces: documented commands và một verified foundation gate cho Identity
  plan.

- [ ] **Step 1: Thêm convenience scripts**

Thêm vào `backend/package.json`:

```json
{
  "scripts": {
    "docker:config": "docker compose config",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "verify:foundation": "powershell -ExecutionPolicy Bypass -File scripts/verify-foundation.ps1"
  }
}
```

- [ ] **Step 2: Viết backend README**

Tạo `backend/README.md` với nội dung tối thiểu sau:

````markdown
# GearVN Backend

NestJS microservices backend for the GearVN clone.

## Requirements

- Node.js 22
- Yarn 4.18
- Docker Desktop with Docker Compose

## First run

```powershell
Copy-Item .env.example .env
yarn.cmd install
docker compose up -d --build
yarn.cmd verify:foundation
```

## Public endpoints

- API Gateway: http://localhost:4000/api
- Swagger: http://localhost:4000/docs

Domain services are internal-only and do not publish host ports.

## Verification

```powershell
yarn.cmd lint
yarn.cmd test
yarn.cmd build:all
docker compose config
yarn.cmd verify:foundation
```

## Data warning

PostgreSQL data lives in the `gearvn_backend_postgres_data` volume. Do not
remove the volume unless the target has been verified and its data is disposable.
````

Do not copy secrets or actual `.env` values into README.

- [ ] **Step 3: Run full local verification**

```powershell
yarn.cmd lint
yarn.cmd test
yarn.cmd build:all
docker compose config
docker compose up -d --build
yarn.cmd verify:foundation
git status --short
```

Expected:

- lint, test và build exit `0`;
- Compose config hợp lệ;
- seven containers running/healthy;
- foundation verification pass;
- Git status chỉ chứa expected README/package/lock changes trước commit.

- [ ] **Step 4: Commit foundation documentation**

```powershell
git add backend/README.md backend/package.json backend/yarn.lock
git diff --cached --check
git commit -m "docs: document backend foundation workflow"
```

- [ ] **Step 5: Record acceptance evidence**

Run và lưu output trong task report hoặc review message, không commit runtime
logs:

```powershell
git log --oneline -8
docker compose ps
yarn.cmd test
yarn.cmd build:all
yarn.cmd verify:foundation
```

Foundation hoàn thành khi toàn bộ command exit `0`. Sau đó mới viết Identity
Service implementation plan dựa trên actual generated Nest files và versions
trong `backend/yarn.lock`.
