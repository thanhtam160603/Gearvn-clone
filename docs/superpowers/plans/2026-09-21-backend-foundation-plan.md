# GearVN Backend Foundation Implementation Plan

> **Bản kế hoạch lịch sử:** cấu hình backend/.env dùng chung trong các step
> phía dưới đã được thay bằng [Plan 00A — env từng service](2026-09-24-backend-service-env-plan.md).
> Khi thực hiện hiện tại, dùng [Plan 00–07](2026-09-21-nestjs-microservices-backend-roadmap.md)
> làm nguồn chính. Không chép backend/.env.example cũ hoặc Compose env chung
> sang sáu service; không xóa env local đã có trước khi xác minh migration.

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

**Tech Stack:** Node.js 22, Yarn 4.18, NestJS 12, TypeScript, Rspack, Oxlint,
Zod, Helmet, PostgreSQL 17, Docker Compose.

**Spec:**
`docs/superpowers/specs/2026-09-21-nestjs-microservices-backend-design.md`

## Scope update - 2026-09-23

Health/probe controllers are out of the current scope. Do not create
`health.controller.ts`, `probe.controller.ts`, `probe.dto.ts`, or shared
`libs/common/src/health/*`. Task 4 and Task 5 below are legacy foundation
content kept for reference; do not execute their health/probe steps.

The current implementation source of truth is
`docs/superpowers/plans/2026-09-22-full-backend-implementation-plan.md`.
That plan focuses on auth, catalog, cart, order, warranty, chat, Gateway
proxy, Prisma, and Docker.

Swagger/OpenAPI is not part of the current implementation. Any Swagger wording
remaining in the legacy sections below is historical reference only; do not
install the package or add a `/docs` route.

## Global Constraints

- Chỉ tạo/sửa `backend/**`, `.gitignore` khi thật sự cần; không sửa runtime
  frontend trong `src/`.
- API Gateway là app duy nhất expose host port.
- Chưa cài Prisma trong foundation; từng domain plan sẽ thêm Prisma schema/client
  riêng.
- Chưa cài RabbitMQ vì scope hiện tại chưa có async consumer bắt buộc.
- Dùng `.env.example`; không commit `.env`.
- Dùng `yarn.cmd` trên Windows nếu PowerShell chặn `yarn.ps1`.
- Foundation không tạo automated test theo quyết định hiện tại; acceptance dùng
  lint, build, startup checks, HTTP smoke checks và Docker health checks.
- Mọi HTTP app dùng validation, request ID và error envelope chung.
- Không dùng `latest` trong committed dependencies; scaffold xong phải giữ exact
  major và lockfile.

## Review Focus

- Thiếu hoặc sai `PORT` phải làm app dừng khi startup với lỗi config rõ ràng;
  Task 2 cấu hình fail-fast và Task 4 xác minh qua startup smoke check.
- Client gửi `x-request-id` rỗng/quá dài phải nhận request ID mới thay vì làm bẩn
  log; Task 4 xác minh qua HTTP smoke check.
- Unknown DTO property phải bị từ chối thay vì âm thầm đi qua; Task 4 xác minh
  bằng HTTP smoke check.
- PostgreSQL volume mới phải có đủ năm database; Task 6 kiểm tra bằng script
  truy vấn `pg_database`.
- Compose không được publish port của domain service; Task 7 kiểm tra rendered
  Compose config và host health behavior.

## Cách đọc và thực hiện plan

- Thực hiện tuần tự từng task vì task sau sử dụng file và contract của task
  trước.
- Trong mỗi step, khối lệnh là phần cần chạy hoặc code cần viết; phần
  **Tác dụng** giải thích mục tiêu; phần **Cần nhớ** nêu lỗi thường gặp.
- Tất cả lệnh Yarn của backend phải chạy trong thư mục `backend/`. Có thể kiểm
  tra vị trí hiện tại bằng `Get-Location`.
- `apps/` chứa chương trình có thể khởi động; `libs/` chứa code dùng chung và
  không tự chạy.
- Foundation chỉ dựng khung chạy ổn định. Auth, catalog, cart, order, warranty,
  Prisma và chat nghiệp vụ được triển khai trong các plan sau.

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
      http/request-id.middleware.ts
      bootstrap-http-app.ts
  docker/postgres/init/001-create-databases.sql
  scripts/
    verify-databases.ps1
    verify-foundation.ps1
  .dockerignore
  .env.example
  .yarnrc.yml
  compose.yaml
  Dockerfile
  README.md
  nest-cli.json
  package.json
  tsconfig.json
  yarn.lock
```

---

### Task 1: Scaffold NestJS monorepo và khóa workspace contract

**Mục tiêu task:** Tạo bộ khung vật lý của backend: sáu chương trình độc lập,
bốn thư viện dùng chung, một dependency tree và cấu hình build thống nhất. Đây
là móng; chưa có logic nghiệp vụ.

**Files:**
- Create: `backend/package.json`
- Create: `backend/yarn.lock`
- Create: `backend/.yarnrc.yml`
- Create: `backend/nest-cli.json`
- Create: `backend/tsconfig.json`
- Create: `backend/tsconfig.build.json`
- Create: `backend/apps/*/tsconfig.app.json`
- Create: `backend/apps/api-gateway/src/api-gateway.module.ts`
- Create: `backend/apps/identity-service/src/identity-service.module.ts`
- Create: `backend/apps/catalog-service/src/catalog-service.module.ts`
- Create: `backend/apps/cart-service/src/cart-service.module.ts`
- Create: `backend/apps/order-service/src/order-service.module.ts`
- Create: `backend/apps/chat-service/src/chat-service.module.ts`
- Create: `backend/apps/*/src/main.ts`
- Create: `backend/libs/config/**`
- Create: `backend/libs/common/**`
- Create: `backend/libs/contracts/**`
- Create: `backend/libs/auth/**`

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

**Tác dụng:** Bước này khóa môi trường phát triển trước khi sinh source. Nếu hai
máy dùng Node/Yarn khác nhau, cùng một `package.json` vẫn có thể tạo lockfile
hoặc dependency tree khác nhau.

**Cần nhớ:** `docker version` phải có cả phần Client và Server. Chỉ có Client
nghĩa là Docker CLI đã cài nhưng Docker Desktop engine chưa chạy.

- [ ] **Step 2: Tạo Nest standard project làm nguồn chuyển đổi monorepo**

Run từ repository root:

```powershell
yarn.cmd dlx @nestjs/cli@12 new backend --package-manager yarn --strict --skip-git
Set-Location -LiteralPath backend
```

Khi CLI hỏi telemetry, chọn theo ý người dùng; lựa chọn này không ảnh hưởng source.

Khi CLI hỏi module system, chọn **CJS**. Khi hỏi `@nestjs/observe`, chọn
**No** trong foundation.

**Tác dụng của command:**

- `yarn.cmd dlx` tải và chạy Nest CLI tạm thời, không cần cài CLI global.
- `@nestjs/cli@12` khóa major CLI tương ứng với NestJS 12.
- `new backend` tạo standard project ban đầu; Nest sẽ dùng project này làm
  nguồn khi chuyển sang monorepo.
- `--strict` bật TypeScript strict mode để phát hiện lỗi type sớm.
- `--skip-git` ngăn Nest tạo repository Git lồng bên trong repository hiện tại.
- `Set-Location` chuyển terminal vào backend; các lệnh sau phụ thuộc vị trí này.

- [ ] **Step 3: Tách Yarn project và cài dependency backend**

Tạo `backend/.yarnrc.yml`:

```yaml
nodeLinker: node-modules
```

Nếu scaffold không tạo `backend/yarn.lock`, tạo một file `yarn.lock` trống
trong `backend/`, rồi chạy:

```powershell
if (Test-Path -LiteralPath '.yarnrc.lock') {
  Remove-Item -LiteralPath '.yarnrc.lock' -Force
}
yarn.cmd install
yarn.cmd nest --version
```

**Tác dụng:** Repository gốc đã là một Yarn project của frontend. Lockfile nằm
trong `backend/` đánh dấu backend là project Yarn độc lập; `nodeLinker:
node-modules` yêu cầu Yarn tạo `backend/node_modules`, phù hợp với Nest CLI,
Rspack và Dockerfile trong plan.

**Cần nhớ:** Không tạo file `.yarnrc.lock`; Yarn chỉ dùng `.yarnrc.yml` và
`yarn.lock`. Chỉ chuyển sang bước tiếp theo khi `yarn.cmd nest --version`
chạy được trong `backend/`.

- [ ] **Step 4: Chuyển sang Nest monorepo và tạo application/library projects**

Run trong `backend/`:

```powershell
yarn.cmd nest generate app api-gateway --no-spec
yarn.cmd nest generate app identity-service --no-spec
yarn.cmd nest generate app catalog-service --no-spec
yarn.cmd nest generate app cart-service --no-spec
yarn.cmd nest generate app order-service --no-spec
yarn.cmd nest generate app chat-service --no-spec
yarn.cmd nest generate library config --no-spec
yarn.cmd nest generate library common --no-spec
yarn.cmd nest generate library contracts --no-spec
yarn.cmd nest generate library auth --no-spec
```

Nest CLI chuyển project standard ban đầu thành monorepo khi app đầu tiên được
generate. Đây là behavior chính thức của Nest workspace; không tự tạo sáu
`package.json` vì Nest monorepo dùng dependency/config chung.

Nếu CLI hỏi library prefix, nhập `@app` để aliases khớp `@app/config`,
`@app/common`, `@app/contracts` và `@app/auth` trong plan.

**Tác dụng:** Lệnh generate app đầu tiên khiến Nest chuyển standard project
thành monorepo. Sáu application là sáu process có thể chạy độc lập; bốn library
là source dùng chung được import bằng alias `@app/*`.

**Cần nhớ:** `--no-spec` ngăn CLI sinh file test mới. Không tạo
`package.json` riêng trong từng app vì Nest monorepo cố ý dùng một dependency
tree chung.

- [ ] **Step 5: Xóa app scaffold tạm và chuẩn hóa project mặc định**

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

Nest CLI 12 có thể chuyển config sang Rspack nhưng không tự thêm đủ package.
Cài các dependency compiler sau:

```powershell
yarn.cmd add --dev @rspack/core webpack-node-externals tsconfig-paths-webpack-plugin
```

Trong `backend/tsconfig.json`, xóa reference cũ tới
`./apps/backend/tsconfig.app.json` vì thư mục tạm đã bị xóa. Nếu `types` còn
`"jest"`, sửa thành:

```json
"types": ["node"]
```

**Tác dụng của các phần cấu hình:**

- `sourceRoot` và `root` chọn `api-gateway` làm project mặc định.
- `projects` là registry để Nest CLI biết tên project, loại project và vị trí
  entry point/TypeScript config.
- `entryFile: "main"` nghĩa là mỗi application khởi động từ `src/main.ts`.
- `builder: "rspack"` bundle code application cùng các alias `@app/*`.
- `@rspack/core` thực hiện compile/bundle;
  `webpack-node-externals` để dependency Node nằm ngoài bundle;
  `tsconfig-paths-webpack-plugin` giúp Rspack hiểu alias trong `tsconfig.json`.

**Cần nhớ:** `nest-cli.json` và `tsconfig.json` là hai lớp khác nhau. Xóa project
khỏi Nest registry nhưng quên xóa TypeScript reference vẫn để lại một đường dẫn
không tồn tại.

- [ ] **Step 6: Bỏ test scaffold và chuẩn hóa scripts build/lint**

Nest CLI sinh sẵn test tooling. Liệt kê các file test trong phạm vi
`backend/apps` và `backend/libs` trước khi xóa:

```powershell
$generatedTestFiles = Get-ChildItem -LiteralPath 'apps','libs' -Recurse -File -Filter '*.spec.ts'
$generatedTestFiles | Select-Object -ExpandProperty FullName
$generatedTestFiles | Remove-Item -Force
```

Nếu thư mục `backend/test` do CLI tạo vẫn tồn tại, xác minh nó nằm trực tiếp
trong backend root rồi mới xóa:

```powershell
if (Test-Path -LiteralPath 'test') {
  $backendRoot = (Resolve-Path -LiteralPath '.').Path
  $testPath = (Resolve-Path -LiteralPath 'test').Path
  if ((Split-Path -Parent $testPath) -ne $backendRoot) {
    throw "Refusing to remove test directory outside backend root"
  }
  Remove-Item -LiteralPath $testPath -Recurse -Force
}
```

Gỡ các package test do scaffold cài:

```powershell
if (Test-Path -LiteralPath 'jest.config.ts') {
  Remove-Item -LiteralPath 'jest.config.ts' -Force
}
yarn.cmd remove @nestjs/testing @types/jest @types/supertest jest supertest ts-jest
```

Nếu package nào không tồn tại và Yarn báo lỗi, bỏ đúng package đó khỏi command
rồi chạy lại. Xóa `backend/jest.config.ts`, các script bắt đầu bằng `test` và
top-level `jest` configuration khỏi `backend/package.json`.

Trong `backend/package.json`, chuẩn hóa scripts:

```json
{
  "scripts": {
    "build": "nest build api-gateway",
    "build:all": "nest build api-gateway && nest build identity-service && nest build catalog-service && nest build cart-service && nest build order-service && nest build chat-service",
    "format": "prettier --write \"apps/**/*.ts\" \"libs/**/*.ts\"",
    "start:gateway:dev": "nest start api-gateway --watch",
    "lint": "oxlint --type-aware apps/ libs/"
  }
}
```

**Code PowerShell ở đầu step hoạt động như sau:**

- `Get-ChildItem` chỉ tìm file `*.spec.ts` trong `apps` và `libs`.
- Kết quả được giữ trong `$generatedTestFiles` để có thể in danh sách kiểm tra
  trước khi xóa.
- `Select-Object -ExpandProperty FullName` chỉ hiển thị đường dẫn, chưa sửa file.
- `Remove-Item -Force` xóa đúng các file đã được liệt kê.
- Khối `Resolve-Path` đảm bảo thư mục `test` thật sự nằm trực tiếp trong backend
  root trước khi dùng xóa đệ quy, tránh xóa nhầm thư mục khác.

**Cần nhớ:** Scaffold NestJS 12 của dự án đang dùng Oxlint, không có ESLint.
Vì vậy script phải gọi `oxlint`. Sau khi sửa scripts, chạy `yarn.cmd install`
để `yarn.lock` phản ánh việc gỡ test dependencies.

- [ ] **Step 7: Build toàn bộ workspace**

Run:

```powershell
yarn.cmd build:all
```

Expected: cả sáu app build thành công và command exit `0`. Kết quả này xác nhận
`nest-cli.json`, TypeScript config, application entry points và shared-library
aliases đủ hợp lệ để Nest biên dịch toàn bộ workspace.

**Tác dụng:** `build:all` không chỉ kiểm tra syntax; nó buộc Nest đọc từng project
config, resolve alias và tạo output cho cả sáu process. Một app build được không
chứng minh năm app còn lại có cấu hình đúng.

**Cần nhớ:** Nếu báo thiếu `@rspack/core`, quay lại Step 5 và cài đủ ba package
Rspack. Không giải quyết bằng cách xóa builder khi kiến trúc đã chọn Rspack.

- [ ] **Step 8: Commit workspace scaffold**

```powershell
git add backend
git diff --cached --check
git commit -m "chore: scaffold NestJS backend workspace"
```

**Tác dụng:** Commit tạo checkpoint chỉ chứa workspace skeleton. Các task sau có
thể được review hoặc quay lại riêng mà không trộn với thay đổi hạ tầng HTTP/DB.

**Ý nghĩa lệnh:** `git add` đưa thay đổi vào staging; `git diff --cached --check`
phát hiện whitespace lỗi trước commit; `git commit` lưu snapshot có thông điệp.

---

### Task 2: Shared environment validation

**Mục tiêu task:** Biến environment từ các chuỗi không đáng tin thành một
contract có type và validation. Service phải từ chối khởi động khi thiếu/sai
config thay vì chạy trong trạng thái nửa đúng.

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/libs/config/src/env.ts`
- Modify: `backend/libs/config/src/config.module.ts`
- Modify: `backend/libs/config/src/index.ts`
- Delete: `backend/libs/config/src/config.service.ts` (CLI scaffold không dùng)

**Interfaces:**
- Consumes: Nest `ConfigModule` and raw `process.env` values.
- Produces: `validateBaseEnv(raw): BaseEnv` and `BackendConfigModule` used by all
  application modules.

- [ ] **Step 1: Cài configuration dependencies**

Run trong `backend/`:

```powershell
yarn.cmd add @nestjs/config zod@4.6.5
```

**Tác dụng:** `@nestjs/config` đọc `.env` và đưa config vào dependency-injection
container; Zod mô tả schema và chuyển dữ liệu chuỗi từ environment sang type mà
ứng dụng cần. Hai package giải quyết hai việc khác nhau: đọc config và kiểm tra
config.

**Dependency boundary:** Lệnh phải chạy trong `backend/`, vì backend có
`package.json` và `yarn.lock` riêng. Việc frontend root đã có Zod không thay thế
khai báo Zod của backend; Docker build backend chỉ đọc manifest của `backend/`.
Sau lệnh này, hai package phải xuất hiện trong `backend/package.json` và
`backend/yarn.lock`.

- [ ] **Step 2: Cập nhật schema và module config đã được Nest CLI scaffold**

Nest CLI đã tạo sẵn `env.ts`? Không: file `env.ts` là file của foundation, nên tạo
mới file này. Ngược lại, `config.module.ts` và `index.ts` đã tồn tại do lệnh
`nest generate library config`; phải thay nội dung scaffold, không tạo thêm file
trùng tên.

Tạo hoặc thay nội dung `backend/libs/config/src/env.ts`:

```ts
import { z } from "zod";

export const baseEnvSchema = z.looseObject({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    SERVICE_NAME: z.string().trim().min(1),
    PORT: z.coerce.number().int().min(1024).max(65535),
    FRONTEND_ORIGIN: z.url(),
  });

export type BaseEnv = z.infer<typeof baseEnvSchema>;

export function validateBaseEnv(raw: Record<string, unknown>): BaseEnv {
  const result = baseEnvSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(`Invalid environment: ${result.error.message}`);
  }

  return result.data;
}
```

**Giải thích `env.ts`:** Environment luôn đi vào Node dưới dạng chuỗi hoặc
`undefined`. `z.coerce.number()` đổi `"4000"` thành `4000`; `int/min/max` giới
hạn port hợp lệ; `trim().min(1)` không chấp nhận tên service rỗng;
`z.url()` buộc origin có URL hợp lệ. `z.looseObject()` giữ lại các biến riêng của
từng service như `DATABASE_URL` để plan sau kiểm tra tiếp; đây là API Zod 4 thay
cho `.passthrough()` đã deprecated.

`z.infer` sinh type `BaseEnv` trực tiếp từ schema, tránh viết một interface có
thể lệch với validation thật. `safeParse` trả kết quả success/error thay vì ném
lỗi ngay; hàm `validateBaseEnv` chủ động ném thông báo thống nhất khi dữ liệu sai.

Thay toàn bộ nội dung `backend/libs/config/src/config.module.ts` bằng:

```ts
import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { validateBaseEnv } from "./env";

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateBaseEnv,
    }),
  ],
  exports: [NestConfigModule],
})
export class BackendConfigModule {}
```

Xóa file service mẫu do Nest CLI sinh và không còn dùng:

```powershell
Remove-Item -LiteralPath 'libs/config/src/config.service.ts' -Force
```

Thay `backend/libs/config/src/index.ts` bằng:

```ts
export * from "./config.module";
export * from "./env";
```

**Giải thích `config.module.ts`:**

- `@Module` khai báo một Nest module.
- `ConfigModule.forRoot()` đọc `process.env` và file `.env` lúc startup.
- `isGlobal: true` cho phép các app dùng `ConfigService` mà không phải import lại
  `ConfigModule` ở từng feature module.
- `cache: true` tránh đọc/parse lại cùng biến nhiều lần.
- `validate: validateBaseEnv` làm service dừng ngay nếu config sai.
- `exports: [ConfigModule]` cho các module nhập `BackendConfigModule` sử dụng
  provider của `ConfigModule`.

Trong code mới, tên `NestConfigModule` chỉ là alias để phân biệt module chính
của `@nestjs/config` với wrapper `BackendConfigModule` của dự án. Consumer sau
này dùng `ConfigService` của Nest:

```ts
import { ConfigService } from "@nestjs/config";
```

`index.ts` là **barrel file**: consumer import từ `@app/config` thay vì biết cấu
trúc file bên trong library. Đây là contract công khai của library config.

**Giải thích:** Validate lúc startup giúp service fail-fast; lỗi config không bị
trì hoãn tới request đầu tiên.

- [ ] **Step 3: Chạy lint và build**

```powershell
yarn.cmd lint
yarn.cmd build:all
```

Expected: lint và build exit `0`. Hành vi fail-fast của schema được kiểm tra
bằng startup smoke check sau khi API Gateway được nối với `BackendConfigModule`
ở Task 4.

**Tác dụng:** Lint phát hiện pattern/type đáng ngờ; build xác nhận mọi app vẫn
compile sau khi thêm config library. Chưa thể smoke-test startup ở đây vì app
chưa hoàn tất bootstrap dùng config; Task 4 sẽ kiểm tra hành vi thực tế.

- [ ] **Step 4: Commit config contract**

```powershell
git add backend/package.json backend/yarn.lock backend/libs/config
git diff --cached --check
git commit -m "feat: validate backend environment configuration"
```

**Tác dụng:** Khóa riêng contract environment. Từ commit này trở đi mọi service
có thể dựa vào `PORT`, `SERVICE_NAME` và `FRONTEND_ORIGIN` đã được validate.

---

### Task 3: Request ID, validation pipe và error envelope

**Mục tiêu task:** Chuẩn hóa hành vi HTTP dùng chung để mọi service validate
input giống nhau, trả lỗi cùng cấu trúc và có request ID phục vụ trace/debug.

**Files:**
- Create: `backend/libs/common/src/http/request-id.middleware.ts`
- Create: `backend/libs/common/src/errors/api-error.ts`
- Create: `backend/libs/common/src/errors/api-error.filter.ts`
- Create: `backend/libs/common/src/bootstrap-http-app.ts`
- Modify: `backend/libs/common/src/index.ts`

**Interfaces:**
- Consumes: Express request/response and Nest `HttpException`.
- Produces: `RequestIdMiddleware`, `ApiError`, `ApiErrorFilter` và
  `configureHttpApp(app, options)`.

- [ ] **Step 1: Cài HTTP foundation dependencies**

```powershell
yarn.cmd add class-transformer class-validator helmet
```

**Tác dụng:** `class-validator` kiểm tra DTO bằng decorator; `class-transformer`
hỗ trợ chuyển payload thành instance/type phù hợp; Helmet thêm các HTTP security
headers phổ biến. Đây là dependency chung cho tất cả HTTP application.

- [ ] **Step 2: Implement request ID middleware**

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

**Luồng xử lý:** Middleware đọc `x-request-id` từ request. Express có thể trả về
`string`, `string[]` hoặc `undefined`, nên code lấy phần tử đầu nếu là mảng. ID
chỉ được giữ khi là chuỗi không rỗng và không quá 128 ký tự; trường hợp khác tạo
UUID mới. ID được gắn vào cả `request.requestId` cho logger/filter nội bộ và
response header để frontend/support đối chiếu lỗi.

**Cần nhớ:** `next()` bắt buộc để chuyển request sang middleware/controller kế
tiếp. Quên gọi sẽ làm request treo.

- [ ] **Step 3: Implement public error type và global filter**

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

**Tác dụng của `ApiError`:** Đây là lỗi nghiệp vụ có contract ổn định gồm HTTP
status, machine-readable `code`, message cho người dùng và danh sách `details`.
Ví dụ code sau này có thể là `EMAIL_ALREADY_EXISTS` thay vì frontend phải đoán
từ câu chữ.

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

**Luồng của global filter:**

1. `@Catch()` không truyền class nên bắt mọi exception.
2. `switchToHttp()` lấy Express request/response hiện tại.
3. Nếu là `HttpException`, giữ HTTP status; lỗi không biết được đổi thành 500.
4. Chỉ log chi tiết exception server-side cho lỗi 5xx.
5. Response luôn được chuẩn hóa thành `statusCode`, `code`, `message`,
   `requestId`, `details`.
6. Với 5xx, không trả stack trace/nội dung exception thật ra client để tránh lộ
   thông tin nội bộ.

**Cần nhớ:** `requestId` nối response lỗi với log server. Vì thế middleware phải
chạy trước khi filter cần trường này.

- [ ] **Step 4: Implement shared HTTP bootstrap**

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

**Giải thích bootstrap chung:**

- `helmet()` thêm security headers.
- `enableCors` chỉ cho frontend origin cấu hình gọi API; `credentials: true`
  cho phép cookie/authorization credentials khi flow auth dùng đến.
- `transform: true` cho phép chuyển DTO/query primitive theo metadata.
- `whitelist: true` loại property không khai báo trong DTO.
- `forbidNonWhitelisted: true` biến property dư thành lỗi 400 thay vì âm thầm bỏ.
- `useGlobalFilters` áp dụng error envelope cho toàn app.
- `globalPrefix` là optional vì chỉ Gateway dùng `/api`; domain service giữ route
  nội bộ không prefix.

Hàm nhận `INestApplication` thay vì import một app cụ thể, nên sáu application
có thể dùng chung mà không copy cấu hình.

Export `ApiError`, `ApiErrorFilter`, `RequestIdMiddleware`, `RequestWithId` và
`configureHttpApp` trong `backend/libs/common/src/index.ts`.

- `backend/libs/common/src/index.ts` phải export các symbol mà Gateway import:

```ts
export * from "./bootstrap-http-app";
export * from "./errors/api-error";
export * from "./errors/api-error.filter";
export * from "./http/request-id.middleware";
```

Đây là barrel file công khai của `@app/common`. Nếu không export ở đây, import
`RequestIdMiddleware` hoặc `configureHttpApp` từ `@app/common` sẽ lỗi dù file
gốc vẫn tồn tại.

- [ ] **Step 5: Chạy lint và build**

```powershell
yarn.cmd lint
yarn.cmd build:all
```

Expected: lint và build exit `0`. Request ID, validation pipe và error envelope
được kiểm tra qua HTTP smoke check của API Gateway ở Task 4.

**Tác dụng:** Xác nhận shared library compile trước khi nối vào Gateway. Build
không chứng minh runtime behavior, nên Task 4 còn phải gửi request thật.

- [ ] **Step 6: Commit HTTP foundation**

```powershell
git add backend/package.json backend/yarn.lock backend/libs/common
git diff --cached --check
git commit -m "feat: add shared HTTP error and request contracts"
```

**Tác dụng:** Tạo checkpoint cho hạ tầng HTTP dùng chung, tách biệt khỏi route
Gateway và domain service.

---

### Task 4 (legacy): API Gateway health, validation, Swagger và rate limit

> **Đã loại khỏi scope hiện tại.** Không tạo health/probe controller và không
> chạy các bước của task này. Gateway foundation mới được mô tả trong plan
> `2026-09-22-full-backend-implementation-plan.md`.

**Mục tiêu task:** Dựng public entry point duy nhất của backend. Gateway áp dụng
shared HTTP foundation, có health endpoint, OpenAPI docs và giới hạn request cơ
bản trước khi thêm proxy/auth ở plan sau.

**Files:**
- Modify: `backend/package.json`
- Create: `backend/apps/api-gateway/src/health.controller.ts`
- Create: `backend/apps/api-gateway/src/probe.dto.ts`
- Create: `backend/apps/api-gateway/src/probe.controller.ts`
- Modify: `backend/apps/api-gateway/src/api-gateway.module.ts`
- Modify: `backend/apps/api-gateway/src/main.ts`

**Interfaces:**
- Consumes: `BackendConfigModule`, `RequestIdMiddleware`, `configureHttpApp`.
- Produces: public `/api/health/live`, `/api/health/ready`, `/api/probe` và
  `/docs` OpenAPI page on port 4000.

- [ ] **Step 1: Cài Gateway dependencies**

```powershell
yarn.cmd add @nestjs/swagger @nestjs/throttler
```

**Tác dụng:** Swagger sinh tài liệu OpenAPI từ controller/DTO; Throttler giới
hạn tần suất request để giảm abuse. Hai package chỉ được Gateway public sử dụng
ở foundation.

- [ ] **Step 2: Implement controllers và DTO**

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

Khác Gateway health controller trả tên cố định, shared controller đọc
`SERVICE_NAME` từ `ConfigService`. Cùng một class vì thế trả đúng tên
`identity-service`, `catalog-service`… tùy environment của process/container.

`live` trả lời câu hỏi “process có đang sống không?”. `ready` về sau sẽ trả lời
“service có sẵn sàng nhận traffic và kết nối dependency chưa?”. Foundation chưa
có DB/client thật nên cả hai mới trả response tĩnh.

Tạo `backend/apps/api-gateway/src/probe.dto.ts`:

```ts
import { IsString, MinLength } from "class-validator";

export class ProbeDto {
  @IsString()
  @MinLength(1)
  value!: string;
}
```

`ProbeDto` là DTO kiểm chứng validation pipeline, không phải API nghiệp vụ.
`@IsString()` buộc `value` là chuỗi; `@MinLength(1)` không chấp nhận chuỗi rỗng;
dấu `!` nói với TypeScript rằng Nest/class-transformer sẽ gán field khi runtime.

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

`ProbeController` nằm trong file `probe.controller.ts`, vì vậy
`api-gateway.module.ts` phải import bằng:

```ts
import { ProbeController } from "./probe.controller";
```

`@Controller("probe")` tạo route group; `@Post()` map POST `/probe`; `@Body()`
đưa request body đã qua ValidationPipe vào method. Trả lại body giúp quan sát
whitelist/forbid behavior trong smoke check.

- [ ] **Step 3: Cấu hình Gateway module và request ID middleware**

Thay nội dung `backend/apps/api-gateway/src/api-gateway.module.ts`:

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
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("{*splat}");
  }
}
```

**Giải thích ApiGatewayModule:**

- `BackendConfigModule` cung cấp config đã validate.
- `ThrottlerModule.forRoot` định nghĩa baseline 120 request trong 60 giây.
- `controllers` đăng ký health/probe routes.
- Provider với token `APP_GUARD` biến `ThrottlerGuard` thành guard toàn cục.
- `implements NestModule` cho phép cấu hình middleware bằng
  `MiddlewareConsumer`.
- `forRoutes("{*splat}")` là wildcard có tên phù hợp path-to-regexp mới của
  NestJS 12; dùng `"*"` có thể lỗi khi startup.

**Cần nhớ:** Rate limit của login/register sau này phải chặt hơn baseline và
được cấu hình ở Identity flow, không nhồi policy nghiệp vụ vào foundation.

Global `ThrottlerGuard` áp dụng baseline 120 request/phút. Identity plan sẽ đặt
policy chặt hơn cho login/register bằng decorator riêng.

- [ ] **Step 4: Cấu hình bootstrap và Swagger**

Thay `backend/apps/api-gateway/src/main.ts`:

```ts
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { configureHttpApp } from "@app/common";
import type { BaseEnv } from "@app/config";

import { ApiGatewayModule } from "./api-gateway.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApiGatewayModule);
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

**Luồng bootstrap Gateway:**

1. `NestFactory.create(ApiGatewayModule)` dựng dependency graph và HTTP server.
2. Lấy typed `ConfigService<BaseEnv, true>` từ DI container.
3. Áp dụng security, CORS, validation, error filter và prefix `/api`.
4. Tạo OpenAPI document rồi mount Swagger UI ở `/docs`.
5. Listen trên port đã được Zod validate.

`void bootstrap()` cố ý bỏ qua Promise return ở top level nhưng vẫn kích hoạt
hàm async. Nếu startup throw, Nest/Node ghi lỗi và process dừng.

**Lưu ý:** Với global prefix, xác nhận Swagger thực tế ở `/docs`; không tự ghép
thành `/api/docs` nếu bootstrap đang setup `docs` ngoài controller routing.

- [ ] **Step 5: Chạy lint, build và HTTP smoke check**

```powershell
yarn.cmd lint
yarn.cmd build:all
$env:NODE_ENV='development'
$env:SERVICE_NAME='api-gateway'
$env:PORT='70000'
$env:FRONTEND_ORIGIN='http://localhost:3000'
yarn.cmd nest start api-gateway
```

Expected: startup dừng với lỗi config có nhắc tới `PORT`. Sau đó chạy lại bằng
port hợp lệ:

```powershell
$env:PORT='4000'
yarn.cmd nest start api-gateway
```

Trong terminal khác:

```powershell
curl.exe -i http://localhost:4000/api/health/live -H "x-request-id: req-client-123"
curl.exe -i http://localhost:4000/api/health/live -H "x-request-id:"
$longRequestId = 'x' * 129
curl.exe -i http://localhost:4000/api/health/live -H "x-request-id: $longRequestId"
curl.exe -i -X POST http://localhost:4000/api/probe -H "Content-Type: application/json" --data '{"value":"ok","injected":"blocked"}'
curl.exe -i http://localhost:4000/docs
```

Expected:

- request đầu trả HTTP 200, body có `status=ok`, response header giữ
  `x-request-id: req-client-123`;
- request có header rỗng hoặc dài 129 ký tự trả một request ID mới;
- POST chứa property `injected` trả HTTP 400 với `code=VALIDATION_ERROR`;
- Swagger trả HTTP 200.

**Ý nghĩa smoke check:** Lần chạy `PORT=70000` chứng minh fail-fast chứ không chỉ
đọc code schema. Các lệnh `curl` sau đó kiểm tra đầy đủ đường đi runtime:
middleware → validation pipe → controller hoặc error filter → response. ID hợp
lệ phải được giữ, ID rỗng/quá dài phải được thay, payload dư phải bị từ chối.

**Cần nhớ:** Terminal chạy Nest phải tiếp tục mở; dùng terminal thứ hai để gửi
request. Sau khi kiểm tra, dừng server bằng `Ctrl+C` để giải phóng port 4000.

Dừng process bằng `Ctrl+C`, sau đó xóa bốn environment variable khỏi terminal
nếu cần.

- [ ] **Step 6: Commit Gateway baseline**

```powershell
git add backend
git diff --cached --check
git commit -m "feat: add API Gateway foundation"
```

**Tác dụng:** Khóa public entry point đầu tiên trước khi triển khai các domain
service. Commit này chưa proxy request đến service khác; Gateway mới có baseline
HTTP, health, validation, docs và rate limit.

---

### Task 5 (legacy): Domain service health shells

> **Đã loại khỏi scope hiện tại.** Không tạo shared health module cho domain
> service. Chỉ giữ phần cấu hình process cần thiết trong plan triển khai mới.

**Mục tiêu task:** Biến năm app còn lại thành service shell chạy thật, có config,
request ID và health endpoint nhưng chưa mang logic nghiệp vụ.

**Files:**
- Create: `backend/libs/common/src/health/health.controller.ts`
- Create: `backend/libs/common/src/health/health.module.ts`
- Modify: `backend/libs/common/src/index.ts`
- Modify: `backend/apps/identity-service/src/identity-service.module.ts`
- Modify: `backend/apps/catalog-service/src/catalog-service.module.ts`
- Modify: `backend/apps/cart-service/src/cart-service.module.ts`
- Modify: `backend/apps/order-service/src/order-service.module.ts`
- Modify: `backend/apps/chat-service/src/chat-service.module.ts`
- Modify: `backend/apps/identity-service/src/main.ts`
- Modify: `backend/apps/catalog-service/src/main.ts`
- Modify: `backend/apps/cart-service/src/main.ts`
- Modify: `backend/apps/order-service/src/main.ts`
- Modify: `backend/apps/chat-service/src/main.ts`

**Interfaces:**
- Consumes: `BackendConfigModule`, `RequestIdMiddleware`, `configureHttpApp`.
- Produces: internal `/health/live` và `/health/ready` cho năm domain service.

- [ ] **Step 1: Implement shared health module**

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

`HealthModule` đóng gói controller thành đơn vị có thể import. Đây là cách Nest
chia sẻ feature: application không import controller class trực tiếp mà import
module sở hữu controller đó.

Export `HealthModule` trong `backend/libs/common/src/index.ts`.

- [ ] **Step 2: Cấu hình module cho năm domain service**

Ghi đúng đoạn code sau vào cả năm file:

- `backend/apps/identity-service/src/identity-service.module.ts`
- `backend/apps/catalog-service/src/catalog-service.module.ts`
- `backend/apps/cart-service/src/cart-service.module.ts`
- `backend/apps/order-service/src/order-service.module.ts`
- `backend/apps/chat-service/src/chat-service.module.ts`

```ts
import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";

import { HealthModule, RequestIdMiddleware } from "@app/common";
import { BackendConfigModule } from "@app/config";

@Module({
  imports: [BackendConfigModule, HealthModule],
})
export class IdentityServiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("{*splat}");
  }
}
```

Áp dụng cùng nội dung cho năm module, chỉ thay tên class theo bảng sau:

| File | Tên class module |
| --- | --- |
| `identity-service.module.ts` | `IdentityServiceModule` |
| `catalog-service.module.ts` | `CatalogServiceModule` |
| `cart-service.module.ts` | `CartServiceModule` |
| `order-service.module.ts` | `OrderServiceModule` |
| `chat-service.module.ts` | `ChatServiceModule` |

**Tác dụng:** Mỗi domain app nhập ba nền tảng giống nhau: config fail-fast,
health endpoints và request ID middleware. Chúng vẫn là năm process độc lập vì
mỗi app có module theo tên project (`IdentityServiceModule`,
`CatalogServiceModule`, `CartServiceModule`, `OrderServiceModule`,
`ChatServiceModule`) và `main.ts` riêng.

Xóa controller/service scaffold theo tên project (`identity-service.controller.ts`,
`identity-service.service.ts`, và các file tương tự) sau khi module tương ứng
không còn import chúng. Các file `*.spec.ts` đã được loại khỏi scaffold ở Task 1.

- [ ] **Step 3: Cấu hình năm domain main.ts**

Ghi đúng đoạn code sau vào năm file `main.ts` tương ứng trong các app
`identity-service`, `catalog-service`, `cart-service`, `order-service` và
`chat-service`:

```ts
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";

import { configureHttpApp } from "@app/common";
import type { BaseEnv } from "@app/config";

import { IdentityServiceModule } from "./identity-service.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(IdentityServiceModule);
  const config = app.get(ConfigService<BaseEnv, true>);

  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true }),
  });

  await app.listen(config.get("PORT", { infer: true }));
}

void bootstrap();
```

Trong mỗi `main.ts`, import và truyền đúng module tương ứng:

| File `main.ts` | Import | `NestFactory.create(...)` |
| --- | --- | --- |
| `identity-service/src/main.ts` | `IdentityServiceModule` từ `./identity-service.module` | `IdentityServiceModule` |
| `catalog-service/src/main.ts` | `CatalogServiceModule` từ `./catalog-service.module` | `CatalogServiceModule` |
| `cart-service/src/main.ts` | `CartServiceModule` từ `./cart-service.module` | `CartServiceModule` |
| `order-service/src/main.ts` | `OrderServiceModule` từ `./order-service.module` | `OrderServiceModule` |
| `chat-service/src/main.ts` | `ChatServiceModule` từ `./chat-service.module` | `ChatServiceModule` |

**Luồng khởi động:** Giống Gateway nhưng không tạo Swagger, rate limit hay prefix
`/api`. Các service chỉ expose contract nội bộ trên Docker network. Port lấy từ
environment nên cùng một source pattern có thể chạy trên 4001–4005.

**Giải thích:** Domain service không dùng global `/api` prefix vì các route này
chỉ là internal contract. Gateway chịu trách nhiệm public URL.

- [ ] **Step 4: Chạy lint và build toàn workspace**

```powershell
yarn.cmd lint
yarn.cmd build:all
```

Expected: lint và build exit `0`. Health endpoint của cả năm domain service
được xác minh khi toàn bộ Compose stack chạy ở Task 7.

**Tác dụng:** Build cả workspace phát hiện app nào còn import controller/service
đã xóa hoặc alias chưa export. Runtime health của năm app được Docker healthcheck
xác minh sau khi container tồn tại.

- [ ] **Step 5: Commit service shells**

```powershell
git add backend
git diff --cached --check
git commit -m "feat: add backend service health shells"
```

**Tác dụng:** Sau checkpoint này hệ thống có đủ sáu application shell, nhưng năm
domain service chưa có endpoint nghiệp vụ hay database client.

---

### Task 6: PostgreSQL multi-database local infrastructure

**Mục tiêu task:** Chạy PostgreSQL local bằng Docker và tạo database ownership
boundary cho từng domain service, chưa cài Prisma hoặc tạo bảng.

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

**Tác dụng:** `.env.example` là contract cấu hình được commit để thành viên biết
cần biến nào; `.env` là giá trị local thực tế và không được commit. Port 5433 ở
host tránh đụng PostgreSQL khác đang dùng port mặc định 5432; bên trong container
PostgreSQL vẫn nghe 5432.

**Cần nhớ:** Password trong example chỉ dành cho local development. Production
phải lấy secret từ deployment platform, không dùng lại giá trị này.

- [ ] **Step 2: Tạo database initialization SQL**

Tạo `backend/docker/postgres/init/001-create-databases.sql`:

```sql
CREATE DATABASE identity_db;
CREATE DATABASE catalog_db;
CREATE DATABASE cart_db;
CREATE DATABASE order_db;
CREATE DATABASE chat_db;
```

**Tác dụng:** Một PostgreSQL container chứa năm database logic tách biệt. Mỗi
domain service về sau sở hữu schema/migration/database của mình, giảm việc service
này đọc trực tiếp bảng của service khác.

**Cần nhớ:** Đây chưa phải năm PostgreSQL server độc lập. Nó tiết kiệm tài nguyên
local nhưng vẫn giữ boundary database theo service.

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

**Giải thích Compose PostgreSQL:**

- `image` khóa PostgreSQL 17 Alpine thay vì `latest`.
- `container_name` cho tên dễ tìm trong Docker Desktop/CLI.
- `restart: unless-stopped` tự chạy lại sau crash/restart Docker trừ khi chủ động
  stop.
- `environment` khởi tạo user/password và database mặc định `postgres`.
- `ports` ánh xạ host 5433 → container 5432.
- Named volume giữ dữ liệu khi container bị recreate.
- Init directory mount read-only vào cơ chế chính thức của Postgres image.
- Healthcheck chạy `pg_isready`; `healthy` chỉ có nghĩa Postgres nhận connection,
  chưa chứng minh năm database đều tồn tại.

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

**Giải thích verification script:**

- `$ErrorActionPreference = 'Stop'` biến lỗi PowerShell thành lỗi dừng script.
- `$expectedDatabases` là danh sách contract cần có.
- `docker compose exec -T` chạy `psql` trong container; `-T` tắt pseudo-TTY để
  output dễ dùng trong script/CI.
- `-A -t` trả kết quả không căn cột/không header; `-c` chạy câu SQL.
- Vòng `foreach` ném lỗi ngay khi thiếu một database; exit không còn được coi là
  thành công giả.

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

**Tác dụng:** `docker compose config` render và validate YAML/environment trước
khi tạo resource; `up -d postgres` chỉ start DB ở background; `ps` cho trạng thái;
script xác minh dữ liệu khởi tạo thực tế.

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

**Cần nhớ về init script:** Postgres chỉ chạy file trong
`/docker-entrypoint-initdb.d` khi volume hoàn toàn mới. Sửa SQL rồi restart
container không tự chạy lại script. Xóa volume là thao tác mất dữ liệu, chỉ làm
khi đã xác nhận volume development này có thể bỏ.

- [ ] **Step 6: Commit PostgreSQL foundation**

```powershell
git add backend/.env.example backend/compose.yaml backend/docker backend/scripts
git diff --cached --check
git commit -m "chore: add backend PostgreSQL databases"
```

**Tác dụng:** Commit hạ tầng database nhưng không commit `.env` hoặc dữ liệu nằm
trong Docker volume. Source Git chỉ chứa cách tái tạo môi trường.

---

### Task 7: Dockerize sáu application shells

**Mục tiêu task:** Đóng gói sáu Nest application thành container, nối chúng trên
Docker network và chỉ publish API Gateway ra host.

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

**Tác dụng:** `.dockerignore` giảm Docker build context. Không gửi
`node_modules`, output cũ, secret `.env`, Git history hoặc log vào Docker daemon;
build nhanh hơn và tránh vô tình đưa dữ liệu local vào image.

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

**Giải thích ba build stage:**

1. `dependencies`: dùng Node 22 Alpine, bật Corepack, copy duy nhất manifest và
   lockfile rồi chạy `yarn install --immutable`. Docker có thể cache layer này
   cho tới khi dependency thay đổi.
2. `build`: nhận `APP_NAME`, copy source và chỉ build application tương ứng.
3. `runtime`: tạo image chạy cuối, copy dependency và output đã build, không copy
   toàn bộ TypeScript source. `USER node` tránh chạy process ứng dụng bằng root.

`ARG APP_NAME` chỉ tồn tại lúc build; `ENV APP_NAME` đưa giá trị đó sang runtime;
shell trong `CMD` thay `${APP_NAME}` để chạy đúng entry file.

**Cần nhớ:** Trước Task 7 phải quan sát output thật sau `build:all`. Nếu Nest 12
sinh đường dẫn khác `dist/apps/<app>/main.js`, sửa `CMD` theo output thực tế thay
vì đoán. Foundation hiện copy cả dev dependencies sang runtime; plan hardening
sau có thể tối ưu production dependencies/image size.

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

**Cấu trúc chung của mỗi service block:**

- `build.args.APP_NAME` tái sử dụng một Dockerfile để tạo sáu image khác nhau.
- `environment` cung cấp đúng tên service và port cho schema Task 2.
- Gateway có `ports` nên Windows/browser truy cập được port 4000.
- Domain services không có `ports`; chúng chỉ được container khác gọi qua Docker
  DNS, ví dụ `http://identity-service:4001`.
- `healthcheck.test` là thuộc tính Docker Compose, không phải Jest test. Node gọi
  health endpoint bên trong chính container và exit 1 nếu response lỗi.
- `interval`, `timeout`, `retries` quyết định bao lâu Docker đánh dấu container
  `unhealthy`.

PostgreSQL + sáu Nest apps tạo tổng cộng bảy container.

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

**Giải thích gate script:** Đầu tiên gọi Gateway qua host để chắc public entry
point hoạt động. Sau đó render Compose và đếm `published:`; chỉ PostgreSQL và
Gateway được phép publish port. Cuối cùng tái sử dụng script Task 6 để xác minh
năm database. Bất kỳ bước nào throw đều làm verification thất bại.

Domain health được xác minh gián tiếp qua trạng thái `healthy` của từng container
trong `docker compose ps`.

Hai published ports là PostgreSQL development port và API Gateway. Domain
services không được xuất hiện trong danh sách `published:`.

- [ ] **Step 5: Build và start toàn bộ Compose stack**

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

**Ý nghĩa lệnh:** `config` bắt lỗi YAML/biến thiếu; `build` tạo sáu image;
`up -d` tạo/start container ở background; `ps` quan sát trạng thái và health.
Không kết luận thành công ngay sau `up`; healthcheck có thể cần vài chu kỳ 5 giây.

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

**Tác dụng:** Đây là kiểm tra boundary kiến trúc. Domain service vẫn chạy nhưng
host không thể truy cập trực tiếp; mọi public traffic phải đi qua Gateway. Kết
quả `False` ở đây là mong muốn, không phải service bị hỏng.

- [ ] **Step 7: Commit Docker application stack**

```powershell
git add backend/.dockerignore backend/Dockerfile backend/compose.yaml backend/scripts/verify-foundation.ps1
git diff --cached --check
git commit -m "chore: dockerize backend service shells"
```

**Tác dụng:** Checkpoint này đóng gói toàn bộ foundation thành môi trường có thể
tái tạo bằng Docker Compose trên máy khác.

---

### Task 8: Foundation documentation và acceptance gate

**Mục tiêu task:** Biến các lệnh rời rạc thành workflow được tài liệu hóa và đặt
một acceptance gate chứng minh foundation có thể build/chạy/tái tạo.

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

**Tác dụng:** Các script là API dành cho developer: không cần nhớ toàn bộ command
PowerShell/Docker. `docker:down` không kèm `-v`, vì stop/remove container bình
thường không nên xóa database volume.

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
yarn.cmd build:all
docker compose config
yarn.cmd verify:foundation
```

## Data warning

PostgreSQL data lives in the `gearvn_backend_postgres_data` volume. Do not
remove the volume unless the target has been verified and its data is disposable.
````

Do not copy secrets or actual `.env` values into README.

**Tác dụng của README:** Người mới clone repository biết requirement, cách chạy
lần đầu, public URL, cách xác minh và cảnh báo dữ liệu mà không phải đọc toàn bộ
plan thiết kế. README mô tả trạng thái code thực tế, còn plan mô tả quá trình tạo
ra trạng thái đó.

- [ ] **Step 3: Run full local verification**

```powershell
yarn.cmd lint
yarn.cmd build:all
docker compose config
docker compose up -d --build
yarn.cmd verify:foundation
git status --short
```

**Giải thích acceptance gate:**

- lint kiểm tra source theo rule Oxlint;
- build chứng minh sáu application compile;
- Compose config chứng minh YAML render hợp lệ;
- `up -d --build` kiểm tra image/container thật;
- verification script kiểm tra Gateway, port boundary và database;
- Git status giúp phát hiện file generated/secret ngoài dự kiến trước commit.

Expected:

- lint và build exit `0`;
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

**Tác dụng:** Commit README và convenience scripts sau khi chính các command đó
đã được chạy. Không ghi tài liệu “hy vọng là đúng” trước khi xác minh workflow.

- [ ] **Step 5: Record acceptance evidence**

Run và lưu output trong task report hoặc review message, không commit runtime
logs:

```powershell
git log --oneline -8
docker compose ps
yarn.cmd build:all
yarn.cmd verify:foundation
```

**Tác dụng:** Output này là bằng chứng bàn giao có thể dán vào task report/code
review. Không commit log runtime vì log nhanh cũ, gây nhiễu Git và có thể chứa
thông tin môi trường.

Foundation hoàn thành khi toàn bộ command exit `0`. Sau đó mới viết Identity
Service implementation plan dựa trên actual generated Nest files và versions
trong `backend/yarn.lock`.

## Kết quả sau khi hoàn thành Foundation

Bạn sẽ có sáu Nest process build/run được, shared config/HTTP contracts, một API
Gateway public, năm domain service nội bộ, PostgreSQL với năm database và Docker
Compose chạy toàn stack. Bạn **chưa** có đăng ký/đăng nhập thật, Prisma models,
CRUD sản phẩm, giỏ hàng server-side, checkout/order hay WebSocket chat. Mỗi phần
đó sẽ dựa trên foundation này và có plan riêng.
