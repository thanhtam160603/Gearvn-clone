# Auth.js, PostgreSQL và Prisma Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay module đăng nhập mock phía trình duyệt bằng Auth.js Credentials,
PostgreSQL và Prisma, đồng thời giữ nguyên login dialog và giao diện account.

**Architecture:** PostgreSQL 17 chạy trong Docker. Prisma 7 truy cập bảng
`User`; Auth.js xác thực email/password và lưu JWT session trong cookie. Server
dùng `auth()` để bảo vệ dữ liệu; client dùng `useSession()`; Redux chỉ còn quản
lý cart và UI.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript, Auth.js v5, Prisma 7.10,
PostgreSQL 17, Docker Compose, bcryptjs, Zod và Redux Toolkit.

**Spec:**
`docs/superpowers/specs/2026-09-16-authjs-postgresql-prisma-design.md`

## Quyết định về kiểm thử

Theo lựa chọn của chủ dự án, kế hoạch này **không dùng Vitest và không tạo unit
test**. Mỗi task được kiểm tra bằng typecheck, lint, build, truy vấn PostgreSQL
và thao tác thủ công trên trình duyệt. Điều này làm kế hoạch dễ học hơn nhưng
giảm khả năng phát hiện regression tự động.

## Ràng buộc toàn cục

- Không làm đăng ký, quên mật khẩu, OAuth, email verification hoặc 2FA.
- Dùng Auth.js Credentials và `session.strategy = "jwt"`.
- Không dùng `@auth/prisma-adapter` trong giai đoạn này.
- Không lưu password plaintext hoặc auth token trong browser storage/Redux.
- Client Component không import Prisma hoặc module server-only.
- Mutation riêng tư phải lấy user id từ `auth()`, không lấy từ form/query.
- `proxy.ts` hỗ trợ UX nhưng không thay thế authorization cạnh database.
- Không làm thay đổi hành vi cart, collection và category overlay.
- Không stage thay đổi riêng đang có trong `src/components/cart/CartItemRow.tsx`.
- Trên Windows dùng `yarn.cmd` nếu PowerShell chặn `yarn.ps1`.

## Điểm tiếp tục của source hiện tại

- Task 1 đã được kiểm tra: PostgreSQL container đang healthy.
- Phần chính của Task 2 đã có; cần gỡ Vitest và xóa `vitest.config.ts`.
- Migration và generated Prisma Client của Task 3 đã xuất hiện; vẫn phải chạy
  seed và hai truy vấn xác nhận dữ liệu.
- `src/server/db/prisma.ts` đã có.
- `sign-in-schema.ts` hiện chứa nhầm code Vitest; thay bằng implementation ở
  Task 4.
- Xóa file rỗng `profile-in-schema.ts` và tạo `profile-schema.ts` đúng tên.

Với trạng thái này, thực hiện Task 2 Step 3, hoàn thành phần kiểm tra còn lại
của Task 3, rồi làm Task 4. Nếu typecheck ở Task 2 chưa chạy được vì helper
đang dở, hoàn thành Task 4 trước rồi chạy lại typecheck.

## Cấu trúc file cuối cùng

```text
compose.yaml
.env.example
prisma.config.ts
prisma/
  schema.prisma
  seed.ts
  migrations/
src/
  auth.ts
  proxy.ts
  generated/prisma/
  app/api/auth/[...nextauth]/route.ts
  components/auth/AuthSessionProvider.tsx
  server/
    db/prisma.ts
    auth/
      sign-in-schema.ts
      password.ts
      profile-schema.ts
      authorize-credentials.ts
      require-user.ts
      update-profile-core.ts
      update-profile.ts
  types/next-auth.d.ts
```

Không tạo `vitest.config.ts` hoặc `src/**/__tests__`.

---

### Task 1: PostgreSQL local bằng Docker Compose

**Files:**

- Create: `compose.yaml`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Giữ một block env duy nhất trong `.gitignore`**

```gitignore
# env files
.env*
!.env.example
```

- [ ] **Step 2: Cấu hình PostgreSQL**

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

- [ ] **Step 3: Cấu hình environment**

`.env.example`:

```dotenv
DATABASE_URL="postgresql://gearvn:gearvn_local_password@localhost:5432/gearvn?schema=public"
AUTH_SECRET="replace-with-a-random-secret"
```

Tạo `.env.local` và không commit file này:

```powershell
Copy-Item -LiteralPath .env.example -Destination .env.local
```

- [ ] **Step 4: Kiểm tra PostgreSQL**

```powershell
docker compose config
docker compose up -d
docker compose ps
docker compose exec postgres psql -U gearvn -d gearvn -c "SELECT current_database(), current_user;"
```

Kết quả: container `healthy`, database và user đều là `gearvn`.

---

### Task 2: Dependencies và Prisma config, không dùng Vitest

**Files:**

- Modify: `package.json`
- Modify: `yarn.lock`
- Create: `prisma.config.ts`
- Delete if present: `vitest.config.ts`

- [ ] **Step 1: Cài dependencies runtime**

```powershell
yarn.cmd add next-auth@beta @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg bcryptjs zod server-only
```

- [ ] **Step 2: Cài dependencies development cần thiết**

```powershell
yarn.cmd add --dev prisma@7.10.0 tsx @types/pg dotenv
```

- [ ] **Step 3: Gỡ Vitest nếu đã cài**

```powershell
yarn.cmd remove vitest
```

Xóa `vitest.config.ts` và hai scripts sau khỏi `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Tạo `prisma.config.ts`**

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

- [ ] **Step 5: Kiểm tra toolchain**

```powershell
yarn.cmd prisma --version
yarn.cmd tsc --noEmit --incremental false
```

Kết quả: Prisma CLI và Client là `7.10.x`.

---

### Task 3: User schema, migration, generate và seed

**Files:**

- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `prisma/migrations/**`
- Generate: `src/generated/prisma/**`

- [ ] **Step 1: Khai báo schema**

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

- [ ] **Step 2: Validate, migrate và generate**

```powershell
yarn.cmd prisma validate
yarn.cmd prisma migrate dev --name init_auth_user
yarn.cmd prisma generate
```

Prisma 7 cần chạy `generate` rõ ràng. Sau lệnh này phải có
`src/generated/prisma/client.ts`.

- [ ] **Step 3: Tạo development seed**

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

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

- [ ] **Step 4: Seed và kiểm tra database**

```powershell
yarn.cmd prisma db seed
yarn.cmd prisma db seed
docker compose exec postgres psql -U gearvn -d gearvn -c 'SELECT email, COUNT(*) OVER () AS total FROM "User";'
docker compose exec postgres psql -U gearvn -d gearvn -c 'SELECT "passwordHash" LIKE ''$2%'' AS is_bcrypt, "passwordHash" = ''Demo@123'' AS is_plaintext FROM "User";'
```

Kết quả: một user, `is_bcrypt = true`, `is_plaintext = false`.

---

### Task 4: Prisma Client và các validation helper

**Files:**

- Create: `src/server/db/prisma.ts`
- Create: `src/server/auth/sign-in-schema.ts`
- Create: `src/server/auth/password.ts`
- Create: `src/server/auth/profile-schema.ts`
- Delete/rename: `src/server/auth/profile-in-schema.ts`

- [ ] **Step 1: Tạo Prisma singleton server-only**

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
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Viết sign-in schema**

`src/server/auth/sign-in-schema.ts` chỉ chứa implementation, không chứa
`describe`, `it`, `expect` hoặc import từ Vitest:

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

- [ ] **Step 3: Viết password helper**

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

- [ ] **Step 4: Đổi tên và viết profile schema**

Xóa file rỗng `profile-in-schema.ts`; tạo đúng tên `profile-schema.ts`:

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

    const date = new Date(`${value}T00:00:00.000Z`);
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

- [ ] **Step 5: Kiểm tra helper không cần test framework**

```powershell
yarn.cmd tsx -e "import { signInSchema } from './src/server/auth/sign-in-schema.ts'; console.log(signInSchema.parse({ email: ' DEMO@GEARVN.LOCAL ', password: 'Demo@123' }))"
yarn.cmd tsx -e "import { hashPassword, verifyPassword } from './src/server/auth/password.ts'; (async () => { const hash = await hashPassword('Demo@123'); console.log(await verifyPassword('Demo@123', hash), await verifyPassword('Wrong@123', hash)); })()"
yarn.cmd tsc --noEmit --incremental false
```

Kết quả: email được chuẩn hóa; password đúng trả `true`, sai trả `false`;
typecheck exit `0`.

---

### Task 5: Credential authorization và Auth.js config

**Files:**

- Create: `src/server/auth/authorize-credentials.ts`
- Create: `src/types/next-auth.d.ts`
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Tạo credential authorization thuần**

```ts
import { signInSchema } from "@/server/auth/sign-in-schema";

type StoredCredentialUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: "CUSTOMER";
};

type Dependencies = {
  findUserByEmail(email: string): Promise<StoredCredentialUser | null>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
};

export async function authorizeCredentials(raw: unknown, deps: Dependencies) {
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return null;

  const user = await deps.findUserByEmail(parsed.data.email);
  if (!user) return null;

  const valid = await deps.verifyPassword(
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

- [ ] **Step 2: Mở rộng Auth.js types**

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

- [ ] **Step 3: Tạo `src/auth.ts`**

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

- [ ] **Step 4: Tạo Route Handler**

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 5: Tạo secret thật trong `.env.local`**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy kết quả vào `AUTH_SECRET` trong `.env.local`; không commit secret.

- [ ] **Step 6: Kiểm tra**

```powershell
yarn.cmd tsc --noEmit --incremental false
yarn.cmd build
```

---

### Task 6: SessionProvider và login dialog

**Files:**

- Create: `src/components/auth/AuthSessionProvider.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/auth/LoginForm.tsx`
- Modify: `src/components/auth/GlobalLoginDialog.tsx`

- [ ] **Step 1: Tạo provider**

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 2: Mount provider trong root layout**

Đặt `AuthSessionProvider` bên trong `StoreProvider`. Tạm giữ `AuthBootstrap`
cho đến khi Task 10 hoàn thành. Bọc `GlobalLoginDialog` trong
`<Suspense fallback={null}>` nếu component sử dụng `useSearchParams()`.

- [ ] **Step 3: Chuyển LoginForm sang Auth.js**

Xóa imports Redux auth. Giữ local state và submit bằng:

```tsx
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
```

Phải có `try/catch/finally`, local `isSubmitting`, lỗi dịch vụ chung và khu vực
tài khoản demo chỉ hiển thị khi `process.env.NODE_ENV === "development"`.

- [ ] **Step 4: Điều hướng sau login**

Trong `GlobalLoginDialog`, chỉ chấp nhận redirect bắt đầu bằng `/account`;
fallback `/`. Sau khi đóng dialog:

```tsx
router.replace(destination);
router.refresh();
```

- [ ] **Step 5: Kiểm tra thủ công**

```powershell
yarn.cmd dev
```

Kiểm tra login sai, login đúng bằng tài khoản seed và reload vẫn còn session.

---

### Task 7: Header, account menu và logout

**Files:**

- Modify: `src/components/auth/AuthStatusButton.tsx`
- Modify: `src/components/account/AccountMenu.tsx`

- [ ] **Step 1: Đọc session bằng Auth.js**

Trong `AuthStatusButton` dùng:

```tsx
const { data: session, status } = useSession();
```

- `loading`: render skeleton.
- Không có `session.user`: render nút mở Redux login dialog.
- Có user: truyền `session.user` vào `AccountMenu`.

- [ ] **Step 2: Đăng xuất**

```tsx
async function handleLogout() {
  setLoggingOut(true);
  await signOut({ redirect: false });
  router.replace("/");
  router.refresh();
}
```

`AccountMenu` dùng type `NonNullable<Session["user"]>`, không dùng `AuthUser`
mock.

- [ ] **Step 3: Kiểm tra**

```powershell
yarn.cmd tsc --noEmit --incremental false
yarn.cmd lint
```

Kiểm tra header đổi trạng thái sau login/logout và logout vẫn mất session sau
reload.

---

### Task 8: Bảo vệ account route

**Files:**

- Create: `src/proxy.ts`
- Create: `src/server/auth/require-user.ts`
- Modify: `src/components/auth/GlobalLoginDialog.tsx`
- Modify: `src/app/account/layout.tsx`
- Modify: `src/components/account/AccountShell.tsx`
- Modify: `src/components/account/AccountSidebar.tsx`

- [ ] **Step 1: Tạo server authorization helper**

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

- [ ] **Step 3: Tự mở login dialog**

`GlobalLoginDialog` đọc `login=required` bằng `useSearchParams()` và dispatch
`openLoginDialog(nextPath)`. Chỉ nhận `/account` hoặc `/account/...`.

- [ ] **Step 4: Chuyển account layout sang server guard**

Đổi layout thành async, gọi `requireUser()`, bỏ `AuthGate`, truyền safe user
vào `AccountShell` rồi `AccountSidebar`. Sidebar dùng Auth.js `signOut()`.

- [ ] **Step 5: Kiểm tra**

Mở cửa sổ ẩn danh tại `/account/profile`: phải về `/`, dialog tự mở; login xong
quay lại `/account/profile`; logout từ sidebar về `/`.

```powershell
yarn.cmd tsc --noEmit --incremental false
yarn.cmd build
```

---

### Task 9: Lưu profile vào PostgreSQL

**Files:**

- Create: `src/server/auth/update-profile-core.ts`
- Create: `src/server/auth/update-profile.ts`
- Modify: `src/app/account/page.tsx`
- Modify: `src/components/account/AccountOverview.tsx`
- Modify: `src/app/account/profile/page.tsx`
- Modify: `src/components/account/AccountProfileForm.tsx`

- [ ] **Step 1: Tạo profile core**

```ts
import {
  profileSchema,
  type UpdateProfileInput,
} from "@/server/auth/profile-schema";

type ProfileData = {
  displayName: string;
  phone: string;
  birthDate: Date | null;
};

type Dependencies<T> = {
  getUserId(): Promise<string | null>;
  updateUser(userId: string, data: ProfileData): Promise<T>;
};

export async function updateProfileCore<T>(
  raw: UpdateProfileInput,
  dependencies: Dependencies<T>,
): Promise<T> {
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

- [ ] **Step 2: Tạo Server Action**

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

- [ ] **Step 3: Đọc profile phía server**

Account overview/profile page gọi `requireUser()`, rồi query Prisma theo
`user.id`. Chỉ truyền `email`, `displayName`, `phone`, `birthDate` vào client.

- [ ] **Step 4: Chuyển profile form**

Xóa Redux auth imports. Form nhận profile bằng props, dùng `useTransition()`,
gọi `updateProfileAction(draft)`, sau đó:

```tsx
await update();
router.refresh();
setEditing(false);
```

`update` lấy từ `useSession()` để JWT callback đọc lại tên mới từ database.

- [ ] **Step 5: Kiểm tra**

Đổi tên, phone, ngày sinh; reload trang; dữ liệu phải còn trong PostgreSQL và
tên mới phải xuất hiện ở header/sidebar.

```powershell
yarn.cmd tsc --noEmit --incremental false
yarn.cmd lint
```

---

### Task 10: Xóa module auth mock và Redux auth

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
- Delete if unused: `src/types/auth.ts`

- [ ] **Step 1: Audit imports trước khi xóa**

```powershell
rg -n "auth-slice|auth-selectors|mock-auth-service|auth-storage|auth-token|AuthBootstrap|AuthGate|AuthUser|accessToken|refreshToken" src
```

- [ ] **Step 2: Gỡ authReducer và AuthBootstrap**

Xóa `authReducer` khỏi `src/lib/store.ts`; xóa `AuthBootstrap` khỏi root layout.
Không xóa Redux UI slice vì login dialog vẫn dùng nó.

- [ ] **Step 3: Xóa file mock và audit lại**

```powershell
rg -n "auth-slice|auth-selectors|mock-auth-service|auth-storage|auth-token|AuthBootstrap|AuthGate|accessToken|refreshToken" src
```

Kết quả: không còn import runtime nào.

- [ ] **Step 4: Kiểm tra**

```powershell
yarn.cmd tsc --noEmit --incremental false
yarn.cmd lint
yarn.cmd build
```

---

### Task 11: Kiểm tra tích hợp cuối cùng

**Files:** Verify only.

- [ ] **Step 1: Kiểm tra database**

```powershell
docker compose ps
yarn.cmd prisma migrate status
```

- [ ] **Step 2: Kiểm tra source**

```powershell
yarn.cmd tsc --noEmit --incremental false
yarn.cmd lint
yarn.cmd build
```

- [ ] **Step 3: Kiểm tra thủ công trên browser**

```powershell
yarn.cmd dev
```

Checklist bắt buộc:

- Login sai không tạo session và chỉ hiện lỗi chung.
- Login đúng bằng tài khoản seed.
- Reload vẫn giữ session.
- Header và account sidebar hiển thị đúng user.
- Chưa login không truy cập được mọi `/account/*`.
- Profile được lưu vào PostgreSQL và đồng bộ lại session.
- Logout từ header/sidebar đều về `/` và session mất sau reload.
- Cart persistence, collection filter/sort/pagination vẫn hoạt động.
- Tài khoản demo không xuất hiện trong production build.

- [ ] **Step 4: Audit secret và server boundary**

```powershell
git status --short --ignored
rg -n "DATABASE_URL|AUTH_SECRET|passwordHash|Demo@123" src prisma .env.example compose.yaml
rg -n "@/server/db/prisma" src/components --glob "*.tsx"
```

Không commit `.env.local`, `AUTH_SECRET`, database URL production hoặc password
plaintext ngoài development seed. Client Component không import Prisma.

## Thứ tự commit gợi ý

```text
chore: add local PostgreSQL and Prisma setup
feat: add user schema and development seed
feat: add Auth.js credentials session
feat: connect login dialog to Auth.js
feat: protect account routes
feat: persist account profile in PostgreSQL
refactor: remove mock browser authentication
```

Trước mỗi commit, chạy `git diff --cached --name-only` và bảo đảm không stage
`src/components/cart/CartItemRow.tsx` nếu thay đổi đó không thuộc module auth.
