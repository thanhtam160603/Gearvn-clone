# Auth.js, PostgreSQL và Prisma Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan. Thực hiện lần lượt từng
> task và dùng checkbox (`- [ ]`) để theo dõi tiến độ.

**Mục tiêu:** Thay module đăng nhập mock phía trình duyệt bằng xác thực
email/mật khẩu thật sử dụng Auth.js, PostgreSQL và Prisma, đồng thời giữ nguyên
login dialog, account UI, cart và collection hiện tại.

**Kiến trúc:** PostgreSQL 17 chạy cục bộ trong Docker. Prisma 7 truy cập bảng
`User`; Auth.js Credentials kiểm tra password hash và quản lý JWT session
cookie. Server dùng `auth()` để bảo vệ dữ liệu, client dùng `useSession()` cho
header/dialog; Redux chỉ còn quản lý cart và UI.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript 5, Auth.js/NextAuth v5,
Prisma ORM 7.10, PostgreSQL 17, Docker Compose, bcryptjs, Zod, Redux Toolkit,
Vitest và Yarn 4 trên Windows.

**Spec:**
`docs/superpowers/specs/2026-09-16-authjs-postgresql-prisma-design.md`

## Ràng buộc toàn cục

- Chưa làm đăng ký, quên mật khẩu, xác minh email, OAuth hoặc 2FA.
- Dùng Credentials Provider và `session.strategy = "jwt"`.
- Không cài `@auth/prisma-adapter` trong giai đoạn này.
- Password chỉ được lưu dưới dạng bcrypt hash; không log password/hash.
- Không lưu auth token trong Redux, `localStorage` hoặc `sessionStorage`.
- Client Component không được import Prisma hoặc module `src/server/**`.
- Mọi database mutation riêng tư phải gọi `auth()` và lấy user id từ session.
- `proxy.ts` chỉ bảo vệ navigation; không thay authorization cạnh database.
- Giữ nguyên cart persistence, collection và category overlay.
- PostgreSQL local chạy bằng Docker; không cài PostgreSQL native trên Windows.
- Dùng `yarn.cmd` nếu PowerShell chặn `yarn.ps1`.
- Không stage thay đổi hiện có trong `src/components/cart/CartItemRow.tsx`.
- Mỗi task phải hoàn tất kiểm tra và review trước khi chuyển task tiếp theo.

## Sơ đồ file

**Tạo mới:**

```text
compose.yaml
.env.example
prisma.config.ts
prisma/schema.prisma
prisma/seed.ts
prisma/migrations/**
src/generated/prisma/**
src/auth.ts
src/proxy.ts
src/app/api/auth/[...nextauth]/route.ts
src/components/auth/AuthSessionProvider.tsx
src/server/db/prisma.ts
src/server/auth/password.ts
src/server/auth/sign-in-schema.ts
src/server/auth/authorize-credentials.ts
src/server/auth/profile-schema.ts
src/server/auth/update-profile-core.ts
src/server/auth/update-profile.ts
src/server/auth/require-user.ts
src/types/next-auth.d.ts
src/server/auth/__tests__/*.test.ts
vitest.config.ts
```

**Sửa:** `package.json`, `yarn.lock`, `.gitignore`, root layout, account layout,
account pages, các auth component, account component và Redux store.

**Xóa ở task cuối:** auth mock data/service/storage/token/constants, Redux auth
slice/selectors, `AuthBootstrap`, `AuthGate` và type auth mock.

---

### Task 1: Khởi động PostgreSQL local bằng Docker Compose

**Files:**

- Create: `compose.yaml`
- Create: `.env.example`
- Modify: `.gitignore:35-37`

**Interfaces:**

- Consumes: Docker Desktop và Docker Compose đang chạy.
- Produces: PostgreSQL ở `localhost:5432`, database/user `gearvn`, cùng biến
  `DATABASE_URL` cho Prisma.

- [ ] **Step 1: Cho phép commit `.env.example` nhưng tiếp tục ignore secret**

Sửa phần env trong `.gitignore`:

```gitignore
# env files
.env*
!.env.example
```

- [ ] **Step 2: Tạo PostgreSQL service**

Tạo `compose.yaml`:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: gearvn-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: gearvn
      POSTGRES_USER: gearvn
      POSTGRES_PASSWORD: gearvn_local_password
    ports:
      - "5432:5432"
    volumes:
      - gearvn_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gearvn -d gearvn"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  gearvn_postgres_data:
```

- [ ] **Step 3: Tạo env mẫu và env local**

Tạo `.env.example`:

```dotenv
DATABASE_URL="postgresql://gearvn:gearvn_local_password@localhost:5432/gearvn?schema=public"
AUTH_SECRET="replace-with-a-random-secret"
```

Run:

```powershell
Copy-Item -LiteralPath .env.example -Destination .env.local
```

Không commit `.env.local`.

- [ ] **Step 4: Validate và chạy container**

```powershell
docker compose config
docker compose up -d
docker compose ps
```

Expected: service `postgres` có trạng thái `Up ... (healthy)`.

- [ ] **Step 5: Kiểm tra database**

```powershell
docker compose exec postgres psql -U gearvn -d gearvn -c "SELECT current_database(), current_user;"
```

Expected: database và user đều là `gearvn`.

- [ ] **Step 6: Commit**

```powershell
git add .gitignore .env.example compose.yaml
git commit -m "chore: add local PostgreSQL container"
```

---

### Task 2: Cài dependencies và cấu hình Prisma 7, Vitest

**Files:**

- Modify: `package.json`
- Modify: `yarn.lock`
- Create: `prisma.config.ts`
- Create: `vitest.config.ts`

**Interfaces:**

- Consumes: `.env.local` từ Task 1.
- Produces: Prisma/Auth.js libraries và lệnh `yarn.cmd test`.

- [ ] **Step 1: Cài runtime dependencies**

```powershell
yarn.cmd add next-auth@beta @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg bcryptjs zod server-only
```

- [ ] **Step 2: Cài development dependencies**

```powershell
yarn.cmd add --dev prisma@7.10.0 tsx @types/pg vitest dotenv
```

- [ ] **Step 3: Thêm test scripts vào `package.json`**

Giữ các script cũ và thêm:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Tạo Prisma config đọc `.env.local`**

Tạo `prisma.config.ts`:

```ts
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

- [ ] **Step 5: Tạo Vitest config hỗ trợ alias**

Tạo `vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 6: Kiểm tra toolchain**

```powershell
yarn.cmd prisma --version
yarn.cmd vitest --version
```

Expected: Prisma CLI/Client ở nhánh `7.10.x`; Vitest chạy được.

- [ ] **Step 7: Commit**

```powershell
git add package.json yarn.lock prisma.config.ts vitest.config.ts
git commit -m "chore: configure Prisma and auth dependencies"
```

---

### Task 3: Tạo User schema, migration và seed

**Files:**

- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `prisma/migrations/**`
- Create: `src/generated/prisma/**`

**Interfaces:**

- Produces: model `User`, enum `UserRole`, generated Prisma Client và tài khoản
  `demo@gearvn.local`.

- [ ] **Step 1: Tạo Prisma schema**

```prisma
generator client {
  provider            = "prisma-client"
  output              = "../src/generated/prisma"
  runtime             = "nodejs"
  moduleFormat        = "esm"
  importFileExtension = "ts"
}

datasource db {
  provider = "postgresql"
}

enum UserRole {
  CUSTOMER
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  displayName  String
  phone        String    @default("")
  birthDate    DateTime? @db.Date
  role         UserRole  @default(CUSTOMER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

- [ ] **Step 2: Validate và migrate**

```powershell
yarn.cmd prisma validate
yarn.cmd prisma migrate dev --name init_auth_user
```

Expected: schema valid, migration applied và client được generate.

- [ ] **Step 3: Tạo seed idempotent**

Tạo `prisma/seed.ts`:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const email = "demo@gearvn.local";
  const passwordHash = await bcrypt.hash("Demo@123", 12);

  await prisma.user.upsert({
    where: { email },
    update: { displayName: "Demo Customer", passwordHash },
    create: {
      email,
      passwordHash,
      displayName: "Demo Customer",
      role: "CUSTOMER",
    },
  });

  console.log(`Seeded development user: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Database seed failed.");
    await prisma.$disconnect();
    throw error;
  });
```

- [ ] **Step 4: Chạy seed hai lần và kiểm tra chỉ có một user**

```powershell
yarn.cmd prisma db seed
yarn.cmd prisma db seed
docker compose exec postgres psql -U gearvn -d gearvn -c 'SELECT email, COUNT(*) OVER () AS total FROM "User";'
```

Expected: đúng một row và `total = 1`.

- [ ] **Step 5: Xác nhận password không phải plaintext**

```powershell
docker compose exec postgres psql -U gearvn -d gearvn -c 'SELECT "passwordHash" LIKE ''$2%'' AS is_bcrypt, "passwordHash" = ''Demo@123'' AS is_plaintext FROM "User";'
```

Expected: `is_bcrypt = t`, `is_plaintext = f`.

- [ ] **Step 6: Commit**

```powershell
git add prisma src/generated/prisma
git commit -m "feat: add PostgreSQL user schema and seed"
```

---

### Task 4: Tạo Prisma Client server-only

**Files:**

- Create: `src/server/db/prisma.ts`

**Interfaces:**

- Consumes: generated `PrismaClient` và `DATABASE_URL`.
- Produces: `prisma: PrismaClient` dùng chung cho Auth.js và Server Action.

- [ ] **Step 1: Tạo client có global cache**

```ts
import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Typecheck**

```powershell
yarn.cmd tsc --noEmit
```

Expected: không có lỗi import generated client hoặc adapter.

- [ ] **Step 3: Commit**

```powershell
git add src/server/db/prisma.ts
git commit -m "feat: add server-only Prisma client"
```

---

### Task 5: Viết validation và password helpers theo TDD

**Files:**

- Create: `src/server/auth/sign-in-schema.ts`
- Create: `src/server/auth/password.ts`
- Create: `src/server/auth/profile-schema.ts`
- Test: `src/server/auth/__tests__/sign-in-schema.test.ts`
- Test: `src/server/auth/__tests__/password.test.ts`
- Test: `src/server/auth/__tests__/profile-schema.test.ts`

**Interfaces:**

- Produces `signInSchema`, `profileSchema`, `UpdateProfileInput`,
  `hashPassword()` và `verifyPassword()`.

- [ ] **Step 1: Viết test fail cho sign-in schema**

```ts
import { describe, expect, it } from "vitest";

import { signInSchema } from "@/server/auth/sign-in-schema";

describe("signInSchema", () => {
  it("chuẩn hóa email và chấp nhận password hợp lệ", () => {
    expect(
      signInSchema.parse({
        email: "  DEMO@GEARVN.LOCAL ",
        password: "Demo@123",
      }),
    ).toEqual({ email: "demo@gearvn.local", password: "Demo@123" });
  });

  it("từ chối email sai và password dưới 8 ký tự", () => {
    expect(
      signInSchema.safeParse({ email: "invalid", password: "short" }).success,
    ).toBe(false);
  });
});
```

Run:

```powershell
yarn.cmd test src/server/auth/__tests__/sign-in-schema.test.ts
```

Expected: FAIL vì chưa có implementation.

- [ ] **Step 2: Implement sign-in schema**

```ts
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ."),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
    .max(72, "Mật khẩu không được vượt quá 72 ký tự."),
});
```

- [ ] **Step 3: Viết test fail cho password helpers**

```ts
import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password helpers", () => {
  it("hash password và chỉ xác nhận password đúng", async () => {
    const hash = await hashPassword("Demo@123");

    expect(hash).not.toBe("Demo@123");
    await expect(verifyPassword("Demo@123", hash)).resolves.toBe(true);
    await expect(verifyPassword("Wrong@123", hash)).resolves.toBe(false);
  });
});
```

Run:

```powershell
yarn.cmd test src/server/auth/__tests__/password.test.ts
```

Expected: FAIL vì chưa có implementation.

- [ ] **Step 4: Implement password helpers**

```ts
import bcrypt from "bcryptjs";

const PASSWORD_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_COST);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
```

Không đặt `import "server-only"` trong helper thuần này vì Vitest cần import
trực tiếp. Ranh giới server được áp dụng tại `src/auth.ts`, Prisma module và
Server Action; Client Component không được import helper này.

- [ ] **Step 5: Viết test fail cho profile schema**

```ts
import { describe, expect, it } from "vitest";

import { profileSchema } from "@/server/auth/profile-schema";

describe("profileSchema", () => {
  it("chuẩn hóa profile hợp lệ", () => {
    expect(
      profileSchema.parse({
        displayName: "  Nguyễn Văn A  ",
        phone: "0912345678",
        birthDate: "2000-01-01",
      }),
    ).toEqual({
      displayName: "Nguyễn Văn A",
      phone: "0912345678",
      birthDate: "2000-01-01",
    });
  });

  it("từ chối phone sai và ngày tương lai", () => {
    expect(
      profileSchema.safeParse({
        displayName: "Demo",
        phone: "123",
        birthDate: "2999-01-01",
      }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 6: Implement profile schema**

```ts
import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Vui lòng nhập họ và tên."),
  phone: z.string().trim().refine(
    (value) => value === "" || /^0\d{9}$/.test(value),
    "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.",
  ),
  birthDate: z.string().refine((value) => {
    if (value === "") return true;
    if (!datePattern.test(value)) return false;

    const date = new Date(`${value}T00:00:00Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      date <= today
    );
  }, "Ngày sinh không hợp lệ."),
});

export type UpdateProfileInput = z.infer<typeof profileSchema>;
```

- [ ] **Step 7: Chạy toàn bộ helper tests**

```powershell
yarn.cmd test src/server/auth/__tests__
```

Expected: ba test file PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/server/auth
git commit -m "test: add auth validation and password helpers"
```

---

### Task 6: Viết credential authorization có thể kiểm thử

**Files:**

- Create: `src/server/auth/authorize-credentials.ts`
- Test: `src/server/auth/__tests__/authorize-credentials.test.ts`

**Interfaces:**

- Consumes: `signInSchema` và dependencies được truyền từ `src/auth.ts`.
- Produces:

```ts
authorizeCredentials(raw: unknown): Promise<AuthorizedUser | null>
```

- [ ] **Step 1: Viết failing test**

```ts
import { describe, expect, it, vi } from "vitest";

import { authorizeCredentials } from "@/server/auth/authorize-credentials";

const storedUser = {
  id: "user-1",
  email: "demo@gearvn.local",
  passwordHash: "$2b$12$hash",
  displayName: "Demo Customer",
  role: "CUSTOMER" as const,
};

describe("authorizeCredentials", () => {
  it("trả safe user khi credentials hợp lệ", async () => {
    const findUserByEmail = vi.fn().mockResolvedValue(storedUser);
    const verify = vi.fn().mockResolvedValue(true);

    const result = await authorizeCredentials(
      { email: "DEMO@GEARVN.LOCAL", password: "Demo@123" },
      { findUserByEmail, verifyPassword: verify },
    );

    expect(findUserByEmail).toHaveBeenCalledWith("demo@gearvn.local");
    expect(result).toEqual({
      id: "user-1",
      email: "demo@gearvn.local",
      name: "Demo Customer",
      displayName: "Demo Customer",
      role: "CUSTOMER",
    });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("trả null cho user không tồn tại hoặc password sai", async () => {
    await expect(
      authorizeCredentials(
        { email: "none@gearvn.local", password: "Demo@123" },
        {
          findUserByEmail: vi.fn().mockResolvedValue(null),
          verifyPassword: vi.fn(),
        },
      ),
    ).resolves.toBeNull();

    await expect(
      authorizeCredentials(
        { email: "demo@gearvn.local", password: "Wrong@123" },
        {
          findUserByEmail: vi.fn().mockResolvedValue(storedUser),
          verifyPassword: vi.fn().mockResolvedValue(false),
        },
      ),
    ).resolves.toBeNull();
  });
});
```

Run `yarn.cmd test src/server/auth/__tests__/authorize-credentials.test.ts`.
Expected: FAIL vì module chưa tồn tại.

- [ ] **Step 2: Implement authorization với dependency injection**

```ts
import { signInSchema } from "@/server/auth/sign-in-schema";

type StoredCredentialUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: "CUSTOMER";
};

export type AuthorizedUser = {
  id: string;
  email: string;
  name: string;
  displayName: string;
  role: "CUSTOMER";
};

export type AuthorizeCredentialsDependencies = {
  findUserByEmail(email: string): Promise<StoredCredentialUser | null>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
};

export async function authorizeCredentials(
  raw: unknown,
  dependencies: AuthorizeCredentialsDependencies,
): Promise<AuthorizedUser | null> {
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return null;

  const user = await dependencies.findUserByEmail(parsed.data.email);
  if (!user) return null;

  const valid = await dependencies.verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
    displayName: user.displayName,
    role: user.role,
  };
}
```

- [ ] **Step 3: Verify**

```powershell
yarn.cmd test src/server/auth/__tests__/authorize-credentials.test.ts
yarn.cmd tsc --noEmit
```

Expected: test PASS và typecheck exit `0`.

- [ ] **Step 4: Commit**

```powershell
git add src/server/auth/authorize-credentials.ts src/server/auth/__tests__/authorize-credentials.test.ts
git commit -m "feat: authorize credentials from PostgreSQL"
```

---

### Task 7: Cấu hình Auth.js Credentials, JWT session và Route Handler

**Files:**

- Create: `src/types/next-auth.d.ts`
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Modify locally, do not commit: `.env.local`

**Interfaces:**

- `src/auth.ts` export `handlers`, `auth`, `signIn`, `signOut`.
- Session công khai `id`, `email`, `displayName`, `role`; tuyệt đối không có
  `passwordHash`.

- [ ] **Step 1: Mở rộng type của Auth.js**

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      email: string;
      displayName: string;
      role: "CUSTOMER";
    };
  }

  interface User {
    displayName: string;
    role: "CUSTOMER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    displayName?: string;
    role?: "CUSTOMER";
  }
}
```

- [ ] **Step 2: Tạo Auth.js config và nối dependencies thật**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authorizeCredentials } from "@/server/auth/authorize-credentials";
import { verifyPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      authorize(credentials) {
        return authorizeCredentials(credentials, {
          findUserByEmail(email) {
            return prisma.user.findUnique({
              where: { email },
              select: {
                id: true,
                email: true,
                passwordHash: true,
                displayName: true,
                role: true,
              },
            });
          },
          verifyPassword,
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.displayName = user.displayName;
        token.role = user.role;
      }

      if (trigger === "update" && token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { email: true, displayName: true, role: true },
        });

        if (freshUser) {
          token.email = freshUser.email;
          token.name = freshUser.displayName;
          token.displayName = freshUser.displayName;
          token.role = freshUser.role;
        }
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id ?? "";
      session.user.email = token.email ?? "";
      session.user.displayName = token.displayName ?? token.name ?? "";
      session.user.name = session.user.displayName;
      session.user.role = token.role ?? "CUSTOMER";
      return session;
    },
  },
});
```

Nếu `token.id` rỗng thì code account phía server vẫn phải từ chối; fallback
trong callback chỉ giúp type an toàn, không được coi là authorization.

- [ ] **Step 3: Tạo Route Handler**

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Tạo secret local**

```powershell
npx.cmd auth secret
```

Kiểm tra `.env.local` có `AUTH_SECRET` và file vẫn bị Git ignore. Không in hoặc
commit giá trị secret.

- [ ] **Step 5: Verify**

```powershell
yarn.cmd tsc --noEmit
yarn.cmd build
git status --short
```

Expected: typecheck/build exit `0`; `.env.local` không xuất hiện trong status.

- [ ] **Step 6: Commit**

```powershell
git add src/auth.ts src/types/next-auth.d.ts "src/app/api/auth/[...nextauth]/route.ts"
git commit -m "feat: configure Auth.js credentials session"
```

---

### Task 8: Cấp session cho client và chuyển LoginForm sang Auth.js

**Files:**

- Create: `src/components/auth/AuthSessionProvider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/auth/LoginForm.tsx`
- Modify: `src/components/auth/GlobalLoginDialog.tsx`

- [ ] **Step 1: Tạo client provider**

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 2: Bọc application trong provider**

Trong `src/app/layout.tsx`, đặt `AuthSessionProvider` bên trong `StoreProvider`.
Tạm giữ `AuthBootstrap` đến Task 12 để migration có thể thực hiện từng bước.
Nếu `GlobalLoginDialog` dùng `useSearchParams`, bọc riêng component này trong
`<Suspense fallback={null}>` để production build không lỗi static bailout.

- [ ] **Step 3: Thay Redux login thunk trong LoginForm**

Giữ nguyên markup, nhưng thay Redux imports/state bằng:

```tsx
import { signIn } from "next-auth/react";
import { useState, type SubmitEvent } from "react";

const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
  event.preventDefault();
  if (isSubmitting) return;

  setIsSubmitting(true);
  setError(null);

  try {
    const result = await signIn("credentials", {
      redirect: false,
      email: email.trim().toLowerCase(),
      password,
    });

    if (result?.error) {
      setError("Email hoặc mật khẩu không chính xác.");
      setPassword("");
      return;
    }

    onSuccess?.();
  } catch {
    setError("Dịch vụ đăng nhập tạm thời không khả dụng.");
  } finally {
    setIsSubmitting(false);
  }
}
```

Khu vực tài khoản demo phải nằm trong
`process.env.NODE_ENV === "development"`. Không đưa password vào query string.

- [ ] **Step 4: Hoàn thiện success navigation**

Trong `GlobalLoginDialog`, sau khi đóng dialog chỉ nhận destination bắt đầu
bằng `/account`; nếu không hợp lệ dùng `/`. Sau `router.replace(destination)`
gọi `router.refresh()` để Server Components nhìn thấy cookie mới.

- [ ] **Step 5: Verify thủ công**

```powershell
yarn.cmd dev
```

Kiểm tra login sai hiện lỗi chung; login bằng tài khoản seed đóng dialog;
reload vẫn còn session. Sau đó chạy:

```powershell
yarn.cmd tsc --noEmit
yarn.cmd lint
```

- [ ] **Step 6: Commit**

```powershell
git add src/app/layout.tsx src/components/auth/AuthSessionProvider.tsx src/components/auth/LoginForm.tsx src/components/auth/GlobalLoginDialog.tsx
git commit -m "feat: connect login dialog to Auth.js"
```

---

### Task 9: Chuyển header, account menu và logout sang Auth.js

**Files:**

- Modify: `src/components/auth/AuthStatusButton.tsx`
- Modify: `src/components/account/AccountMenu.tsx`

- [ ] **Step 1: Đổi AccountMenu sang Auth.js user type**

Prop `user` dùng `NonNullable<Session["user"]>` thay cho `AuthUser`; UI tiếp
tục đọc `displayName` và `email`, không đọc token.

- [ ] **Step 2: Đổi AuthStatusButton sang useSession**

```tsx
const { data: session, status } = useSession();
const [loggingOut, setLoggingOut] = useState(false);

async function handleLogout() {
  setLoggingOut(true);
  await signOut({ redirect: false });
  router.replace("/");
  router.refresh();
}
```

Mapping UI:

- `status === "loading"`: skeleton hiện tại.
- `!session?.user`: nút mở login dialog qua Redux UI slice.
- Có `session.user`: render `AccountMenu`.

- [ ] **Step 3: Verify và commit**

```powershell
yarn.cmd tsc --noEmit
yarn.cmd lint
git add src/components/auth/AuthStatusButton.tsx src/components/account/AccountMenu.tsx
git commit -m "feat: use Auth.js session in account header"
```

Kiểm tra thủ công: header đổi ngay sau login; logout xóa session, về `/`,
reload không tự đăng nhập lại.

---

### Task 10: Bảo vệ `/account` bằng proxy và authorization phía server

**Files:**

- Create: `src/proxy.ts`
- Create: `src/server/auth/require-user.ts`
- Modify: `src/components/auth/GlobalLoginDialog.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/account/layout.tsx`
- Modify: `src/components/account/AccountShell.tsx`
- Modify: `src/components/account/AccountSidebar.tsx`

- [ ] **Step 1: Tạo helper authorization phía server**

```ts
import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/?login=required&next=/account");
  return session.user;
}
```

Các trang con có thể truyền destination cụ thể sau này; mutation không dùng
redirect helper mà phải trả lỗi authorization rõ ràng.

- [ ] **Step 2: Tạo Next.js 16 proxy**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  if (request.auth?.user) return NextResponse.next();

  const url = new URL("/", request.nextUrl);
  url.searchParams.set("login", "required");
  url.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(url);
});

export const config = { matcher: ["/account/:path*"] };
```

- [ ] **Step 3: Tự mở dialog sau redirect**

Trong `GlobalLoginDialog`, dùng `useSearchParams()` và `useEffect()` để dispatch
`openLoginDialog(nextPath)` khi `login=required`. Chỉ chấp nhận `nextPath` là
`/account` hoặc bắt đầu bằng `/account/`; còn lại dùng `/account`. Root layout
phải bọc dialog trong `Suspense` như Task 8.

- [ ] **Step 4: Đưa session server xuống account shell**

Đổi `src/app/account/layout.tsx` thành `async`, gọi `requireUser()`, bỏ
`AuthGate`, rồi truyền `user` vào `AccountShell` và `AccountSidebar`. Sidebar
dùng prop session user, gọi `signOut({ redirect: false })`, về `/` và refresh;
không còn import auth selectors/slice.

- [ ] **Step 5: Verify lớp UX và lớp authorization**

```powershell
yarn.cmd tsc --noEmit
yarn.cmd build
```

Kiểm tra cửa sổ ẩn danh:

1. Mở trực tiếp `/account/profile`.
2. Bị chuyển về `/` và dialog tự mở.
3. Login thành công quay lại `/account/profile`.
4. Logout từ sidebar quay về `/`.

- [ ] **Step 6: Commit**

```powershell
git add src/proxy.ts src/server/auth/require-user.ts src/app/layout.tsx src/app/account/layout.tsx src/components/auth/GlobalLoginDialog.tsx src/components/account/AccountShell.tsx src/components/account/AccountSidebar.tsx
git commit -m "feat: protect account routes with Auth.js"
```

---

### Task 11: Đọc và cập nhật profile bằng PostgreSQL

**Files:**

- Create: `src/server/auth/update-profile-core.ts`
- Create: `src/server/auth/update-profile.ts`
- Test: `src/server/auth/__tests__/update-profile.test.ts`
- Modify: `src/app/account/page.tsx`
- Modify: `src/components/account/AccountOverview.tsx`
- Modify: `src/app/account/profile/page.tsx`
- Modify: `src/components/account/AccountProfileForm.tsx`

- [ ] **Step 1: Viết failing tests cho authorization của mutation**

Tách core function nhận dependencies để test không cần database:

```ts
it("không update database khi thiếu user id", async () => {
  const updateUser = vi.fn();
  await expect(
    updateProfileCore(validInput, { getUserId: async () => null, updateUser }),
  ).rejects.toThrow("UNAUTHORIZED");
  expect(updateUser).not.toHaveBeenCalled();
});

it("luôn update id lấy từ session", async () => {
  const updateUser = vi.fn().mockResolvedValue(savedProfile);
  await updateProfileCore(validInput, {
    getUserId: async () => "trusted-user-id",
    updateUser,
  });
  expect(updateUser).toHaveBeenCalledWith("trusted-user-id", expect.anything());
});
```

Run test và xác nhận FAIL vì implementation chưa tồn tại.

- [ ] **Step 2: Implement core và Server Action**

`updateProfileCore` phải:

1. Parse bằng `profileSchema`.
2. Lấy user id qua dependency.
3. Throw `UNAUTHORIZED` trước mọi update nếu thiếu id.
4. Chuyển `birthDate` rỗng thành `null`, còn lại thành Date ở UTC.
5. Chỉ update `displayName`, `phone`, `birthDate`.

Server Action có `"use server"`, truyền `auth()` và `prisma.user.update` vào
core, sau đó `revalidatePath("/account")` và
`revalidatePath("/account/profile")`. Không nhận `userId`, `email`, `role` từ
client.

Implementation thuần của `src/server/auth/update-profile-core.ts` (file mà
Vitest import, không import `auth()` hoặc Prisma):

```ts
import {
  profileSchema,
  type UpdateProfileInput,
} from "@/server/auth/profile-schema";

type SavedProfile = {
  email: string;
  displayName: string;
  phone: string;
  birthDate: Date | null;
};

type ProfileUpdateData = {
  displayName: string;
  phone: string;
  birthDate: Date | null;
};

export type UpdateProfileDependencies = {
  getUserId(): Promise<string | null>;
  updateUser(userId: string, data: ProfileUpdateData): Promise<SavedProfile>;
};

export async function updateProfileCore(
  raw: UpdateProfileInput,
  dependencies: UpdateProfileDependencies,
): Promise<SavedProfile> {
  const input = profileSchema.parse(raw);
  const userId = await dependencies.getUserId();

  if (!userId) throw new Error("UNAUTHORIZED");

  return dependencies.updateUser(userId, {
    displayName: input.displayName,
    phone: input.phone,
    birthDate: input.birthDate
      ? new Date(`${input.birthDate}T00:00:00.000Z`)
      : null,
  });
}
```

Implementation server-only của `src/server/auth/update-profile.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import type { UpdateProfileInput } from "@/server/auth/profile-schema";
import { updateProfileCore } from "@/server/auth/update-profile-core";
import { prisma } from "@/server/db/prisma";

export async function updateProfileAction(raw: UpdateProfileInput) {
  const profile = await updateProfileCore(raw, {
    async getUserId() {
      const session = await auth();
      return session?.user?.id || null;
    },
    updateUser(userId, data) {
      return prisma.user.update({
        where: { id: userId },
        data,
        select: {
          email: true,
          displayName: true,
          phone: true,
          birthDate: true,
        },
      });
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return {
    ...profile,
    birthDate: profile.birthDate?.toISOString().slice(0, 10) ?? "",
  };
}
```

- [ ] **Step 3: Đọc account data phía server**

`src/app/account/page.tsx` và `src/app/account/profile/page.tsx` gọi
`requireUser()`, sau đó query Prisma theo `user.id`. Profile page chuyển
`birthDate` thành `YYYY-MM-DD` trước khi truyền Client Component.

`AccountOverview` nhận safe user/profile bằng props, không dùng Redux selector.

- [ ] **Step 4: Chuyển AccountProfileForm sang Server Action**

Component nhận prop:

```ts
type AccountProfileFormProps = {
  profile: {
    email: string;
    displayName: string;
    phone: string;
    birthDate: string;
  };
};
```

Xóa Redux imports. Dùng `useTransition`; khi submit thành công gọi
`await updateProfileAction(draft)`, `await update()` từ `useSession()`, đóng
editing và `router.refresh()`. Hiển thị lỗi công khai, disable nút trong lúc
pending và vẫn giữ client validation cho UX; server validation mới là lớp đáng
tin cậy.

- [ ] **Step 5: Verify**

```powershell
yarn.cmd test src/server/auth/__tests__/update-profile.test.ts
yarn.cmd tsc --noEmit
yarn.cmd lint
```

Kiểm tra thủ công: đổi tên/phone/ngày sinh; reload vẫn giữ dữ liệu; tên mới
xuất hiện ở form, sidebar và header sau session update.

- [ ] **Step 6: Commit**

```powershell
git add src/server/auth/update-profile-core.ts src/server/auth/update-profile.ts src/server/auth/__tests__/update-profile.test.ts src/app/account/page.tsx src/components/account/AccountOverview.tsx src/app/account/profile/page.tsx src/components/account/AccountProfileForm.tsx
git commit -m "feat: persist account profile in PostgreSQL"
```

---

### Task 12: Xóa auth mock và Redux auth sau khi không còn consumer

**Files:**

- Modify: `src/lib/store.ts`
- Modify: `src/app/layout.tsx`
- Delete: `src/data/auth-users.ts`
- Delete: `src/lib/auth-constants.ts`
- Delete: `src/lib/auth-storage.ts`
- Delete: `src/lib/auth-token.ts`
- Delete: `src/lib/mock-auth-service.ts`
- Delete: `src/store/auth-slice.ts`
- Delete: `src/store/auth-selectors.ts`
- Delete: `src/components/auth/AuthBootstrap.tsx`
- Delete: `src/components/auth/AuthGate.tsx`
- Modify if unused: `src/types/auth.ts`

- [ ] **Step 1: Audit trước khi xóa**

```powershell
rg -n "auth-slice|auth-selectors|mock-auth-service|auth-storage|auth-token|AuthBootstrap|AuthGate|AuthUser|accessToken|refreshToken" src
```

Mọi kết quả ngoài chính các file sắp xóa phải được migrate trước. Không xóa
Redux UI slice vì nó vẫn quản lý login dialog.

- [ ] **Step 2: Gỡ reducer và bootstrap**

Xóa `authReducer` khỏi `src/lib/store.ts`; xóa import/render `AuthBootstrap`
khỏi root layout. Nếu `src/types/auth.ts` không còn type nào được dùng thì xóa
file, nếu còn type UI độc lập thì chỉ xóa token/mock types.

- [ ] **Step 3: Xóa các file mock và audit lại**

```powershell
rg -n "auth-slice|auth-selectors|mock-auth-service|auth-storage|auth-token|AuthBootstrap|AuthGate|accessToken|refreshToken" src
```

Expected: không có kết quả runtime.

- [ ] **Step 4: Verify và kiểm tra staging**

```powershell
yarn.cmd test
yarn.cmd tsc --noEmit
yarn.cmd lint
git status --short
```

Không stage thay đổi không liên quan hiện có ở
`src/components/cart/CartItemRow.tsx`.

- [ ] **Step 5: Commit có chọn lọc**

```powershell
git add src/lib/store.ts src/app/layout.tsx src/types/auth.ts src/data/auth-users.ts src/lib/auth-constants.ts src/lib/auth-storage.ts src/lib/auth-token.ts src/lib/mock-auth-service.ts src/store/auth-slice.ts src/store/auth-selectors.ts src/components/auth/AuthBootstrap.tsx src/components/auth/AuthGate.tsx
git diff --cached --name-only
git commit -m "refactor: remove mock browser authentication"
```

Nếu `src/types/auth.ts` vẫn được giữ thì bỏ đường dẫn đó khỏi `git add`.

---

### Task 13: Chạy kiểm tra tích hợp và hồi quy cuối cùng

**Files:**

- Verify only; không tạo commit rỗng.

- [ ] **Step 1: Kiểm tra database và migration**

```powershell
docker compose ps
yarn.cmd prisma migrate status
```

Expected: `gearvn-postgres` healthy và schema up to date.

- [ ] **Step 2: Chạy toàn bộ automated checks theo thứ tự**

```powershell
yarn.cmd test
yarn.cmd tsc --noEmit
yarn.cmd lint
yarn.cmd build
```

Chỉ báo PASS cho command thật sự exit `0`; timeout không được coi là pass.

- [ ] **Step 3: Chạy smoke test trên browser**

```powershell
yarn.cmd dev
```

Checklist:

- Login sai không tạo session và chỉ hiện lỗi chung.
- Login tài khoản seed thành công; reload vẫn còn session.
- Header/menu/account sidebar hiển thị đúng user.
- Mọi `/account/*` bị bảo vệ khi chưa login.
- Profile lưu bền vào PostgreSQL và đồng bộ session.
- Logout ở header và sidebar đều về `/` và session mất sau reload.
- Cart persistence và collection filter/sort/pagination vẫn hoạt động.
- Tài khoản demo không xuất hiện trong production build.

- [ ] **Step 4: Audit secret và client boundary**

```powershell
git status --short --ignored
rg -n "DATABASE_URL|AUTH_SECRET|passwordHash|Demo@123" src prisma .env.example compose.yaml
rg -n "@/server/db/prisma|@/auth" src/components --glob "*.tsx"
```

Expected: không commit secret; `passwordHash` chỉ ở server/seed/schema; Client
Component không import Prisma hoặc server-only `auth()`; password demo chỉ tồn
tại trong seed và development-only helper UI đã được duyệt.

- [ ] **Step 5: Ghi kết quả bàn giao**

Ghi rõ migration đã chạy, tài khoản seed, các command đã pass, test thủ công đã
làm và giới hạn còn lại: chưa có đăng ký, reset password, OAuth, rate limit hay
production database. Không tạo commit nếu không có thay đổi source cần thiết.
