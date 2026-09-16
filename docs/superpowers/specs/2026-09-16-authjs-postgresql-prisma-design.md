# Auth.js, PostgreSQL, and Prisma Authentication Design

## Goal

Replace the current browser-only mock authentication module with real
email/password authentication backed by PostgreSQL. Auth.js owns the session
lifecycle, Prisma owns database access, and the existing GearVN-style login
dialog and account pages remain the user-facing experience.

The first production-shaped increment supports seeded users, login, logout,
protected account pages, and persisted profile updates. Registration, password
reset, email verification, OAuth, and administrative role management remain
outside this increment.

## Approved Decisions

- Keep the frontend and backend in the same Next.js App Router project.
- Run PostgreSQL 17 locally in Docker Desktop through Docker Compose.
- Use Prisma ORM 7 because the current Auth.js integration guidance is based on
  Prisma Client 7.
- Use the Auth.js Credentials provider with a JWT session strategy.
- Query the `User` table directly with Prisma inside `authorize()`.
- Do not add `@auth/prisma-adapter` in this credentials-only increment.
- Hash passwords with `bcryptjs`; never store plaintext passwords.
- Seed a development account instead of building registration initially.
- Make Auth.js the only runtime source of authentication truth.
- Keep Redux Toolkit for cart and UI state, including the global login dialog.
- Remove the Redux auth slice and mock token lifecycle only after every
  consumer has migrated to Auth.js.

## Existing Context

The project uses Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4,
Redux Toolkit, Headless UI, and Yarn 4. Authentication is currently simulated
entirely in the browser:

- `src/store/auth-slice.ts` owns user state, access tokens, refresh tokens,
  expiry timestamps, async operations, and profile updates.
- `src/lib/mock-auth-service.ts` compares credentials against source data and
  creates mock tokens.
- `src/lib/auth-storage.ts` persists a session snapshot in `sessionStorage`.
- `src/components/auth/AuthBootstrap.tsx` restores and refreshes that snapshot.
- `src/components/auth/AuthGate.tsx` protects account UI on the client.
- `src/data/auth-users.ts` contains development credentials in source code.

The account UI, login dialog, cart behavior, collection behavior, and global UI
slice must remain functional throughout the migration.

## Scope

### Included

- Local PostgreSQL container and durable Docker volume.
- Prisma schema, migration, generated client, and development seed.
- Auth.js Credentials provider and JWT-backed session cookie.
- Server-side credential validation and password verification.
- Auth.js route handler.
- Auth.js session type augmentation.
- Client `SessionProvider` for interactive header and dialog UI.
- Existing login dialog integrated with `signIn()`.
- Header and account menu integrated with `useSession()` and `signOut()`.
- Server-side protection for account data and mutations.
- Next.js 16 `proxy.ts` route-level account guard.
- PostgreSQL-backed profile reads and updates.
- Removal of the old mock auth module after migration.
- Focused unit tests and full typecheck, lint, and build verification.

### Excluded

- Public account registration.
- Forgot-password and reset-password flows.
- Email verification.
- Google, GitHub, or other OAuth providers.
- Passkeys, magic links, and two-factor authentication.
- Production rate-limit infrastructure.
- Real order, warranty, or payment persistence.
- Admin dashboards or role-management UI.
- Deployment of PostgreSQL or the Next.js application.

## Architecture

```text
LoginForm
   |
   | signIn("credentials")
   v
Auth.js route handler
/api/auth/[...nextauth]
   |
   v
Credentials.authorize()
   |-- Zod validates email and password
   |-- Prisma finds User by normalized email
   `-- bcryptjs verifies passwordHash
          |
          v
      PostgreSQL
          |
          v
Auth.js creates an encrypted JWT session cookie
          |
          |-- auth() for server code
          `-- useSession() for interactive client UI
```

Authentication has one source of truth: the Auth.js session. Redux does not
copy the session and does not store authentication tokens.

## Local PostgreSQL

The repository will contain a `compose.yaml` with one PostgreSQL service:

```text
Image: postgres:17-alpine
Container name: gearvn-postgres
Database: gearvn
User: gearvn
Host port: 5432
Container port: 5432
Volume: gearvn_postgres_data
Health check: pg_isready
```

The named volume preserves data across normal container restarts and
`docker compose down`. Removing the volume is an explicit destructive action
and is not part of the normal workflow.

The local database credential is development-only. `.env.local` is ignored by
Git, while `.env.example` documents required variable names without secrets.

## Prisma Data Model

The first migration contains only the application user model required by the
credentials flow:

```prisma
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

`email` is normalized with `trim().toLowerCase()` before lookup and seed.
`birthDate` is a database date rather than a timestamp. The Prisma layer maps
it to and from the `YYYY-MM-DD` value used by the existing profile form.

The initial schema intentionally omits Auth.js `Account`, `Session`, and
`VerificationToken` models. They become relevant if a future increment adds
OAuth or database sessions.

## Development Seed

`prisma/seed.ts` creates or updates one development user with `upsert`:

```text
Email: demo@gearvn.local
Password: Demo@123
Display name: Demo Customer
Role: CUSTOMER
```

The seed hashes the password with bcrypt before writing it. Re-running the seed
must not create duplicate users, and neither source logs nor database fields may
contain the plaintext password beyond the explicit local-development input to
the hash function.

## Prisma Client Boundary

`src/server/db/prisma.ts` creates the PostgreSQL driver adapter and Prisma
client. Development reuses a single client through a global cache so hot reload
does not exhaust database connections. This module is server-only and must not
be imported by Client Components.

All database access lives behind server modules, Server Actions, Route
Handlers, or Auth.js callbacks. React client code never imports Prisma.

## Auth.js Configuration

`src/auth.ts` exports the Auth.js `handlers`, `auth`, `signIn`, and `signOut`
functions. Its Credentials provider defines `email` and `password` fields.

The `authorize()` flow is:

1. Parse credentials with a shared Zod sign-in schema.
2. Normalize the email.
3. Query the user by unique email with Prisma.
4. Compare the submitted password against `passwordHash` with bcrypt.
5. Return `null` for any invalid credential outcome.
6. Return only safe identity fields for a valid user.

Unknown email and wrong password use the same public error so the form does not
reveal which accounts exist.

The session strategy is `jwt`. JWT and session callbacks expose only:

```ts
{
  id: string;
  email: string;
  displayName: string;
  role: "CUSTOMER";
}
```

They never expose `passwordHash`, database connection data, or application
secrets. `src/types/next-auth.d.ts` augments Auth.js types for these fields.

## Auth.js Route and Client Provider

`src/app/api/auth/[...nextauth]/route.ts` re-exports Auth.js `GET` and `POST`
handlers.

A small client provider wraps Auth.js `SessionProvider`. It is mounted inside
the existing Redux `StoreProvider` tree without replacing Redux. Interactive
components use `useSession()`; server components and server mutations prefer
`auth()`.

The root layout must not fetch a server session solely to initialize every
public page, because that would unnecessarily make the entire application
depend on request-time auth. Client session loading is acceptable for the
header, while protected server code always verifies independently.

## Login Flow

The existing `LoginDialog` and `LoginForm` remain visually intact. The form no
longer dispatches the Redux `login` thunk. It calls client-side Auth.js
`signIn("credentials", { redirect: false, email, password })`.

On success:

1. Close the global dialog.
2. Navigate to the stored internal destination when present, otherwise home.
3. Refresh the router so server-rendered authenticated UI is regenerated.

On failure:

- Keep the entered email.
- Clear the password field.
- Display a generic Vietnamese invalid-credentials message.
- Do not place credentials or auth errors in the URL.

The development credential helper remains clearly labeled as development-only
and is excluded from production output.

## Logout Flow

Header and account sidebar logout actions call Auth.js `signOut()` without an
automatic external redirect, close any account menu, replace the route with
`/`, and refresh the router.

Logout no longer reads or revokes a Redux refresh token and no longer clears
`sessionStorage`; Auth.js invalidates its own session cookie.

## Protecting Account Routes and Data

Next.js 16 uses `src/proxy.ts` rather than `middleware.ts`. The proxy matcher is
limited to `/account` and `/account/:path*`. An unauthenticated navigation is
redirected to the home page with an internal login-required indicator so the
global dialog can open.

Proxy protection is an early UX boundary, not the authorization boundary.
Every function that reads or mutates private account data calls `auth()` near
the database operation and rejects a missing user id. Server code derives the
target user id from the verified session, never from a form field or query
parameter.

Account pages use server session and database reads where practical. Client
components receive only the safe profile data needed to render interactive
forms.

## Profile Update Flow

The profile form keeps draft state locally. Submitting it invokes a dedicated
Server Action:

```text
AccountProfileForm
   -> updateProfileAction(input)
   -> Zod validates displayName, phone, birthDate
   -> auth() obtains the trusted user id
   -> Prisma updates that user
   -> account paths are revalidated
   -> client session is refreshed from trusted database fields
```

Validation rules remain consistent with the existing UI:

- `displayName` is required after trimming.
- `phone` is empty or matches a Vietnamese ten-digit number beginning with `0`.
- `birthDate` is empty or not later than the current date.
- Email cannot be changed in this increment.

When refreshing the JWT after a profile change, the server re-reads trusted
fields from PostgreSQL. It must not accept a client-supplied role or user id.

## Redux Migration

Redux remains responsible for cart and UI state. Authentication consumers move
in this order:

1. Add Auth.js alongside the existing mock module.
2. Move `LoginForm` to Auth.js.
3. Move header and account menu reads/logout to Auth.js.
4. Move account guards and data access to server auth.
5. Move profile persistence to PostgreSQL.
6. Confirm no imports reference the mock auth module.
7. Remove mock auth files and remove `authReducer` from the store.

The following files are removal candidates only after the migration is proven:

```text
src/data/auth-users.ts
src/lib/auth-constants.ts
src/lib/auth-storage.ts
src/lib/auth-token.ts
src/lib/mock-auth-service.ts
src/store/auth-slice.ts
src/store/auth-selectors.ts
src/components/auth/AuthBootstrap.tsx
src/components/auth/AuthGate.tsx
```

The UI slice continues to own whether the global login dialog is open and the
safe internal post-login destination.

## Error Handling

The module distinguishes internal diagnostics from public messages:

| Failure | Public behavior |
|---|---|
| Invalid email format | Field validation error |
| Missing or invalid password | Field validation error |
| Unknown email | Generic invalid-credentials message |
| Wrong password | Generic invalid-credentials message |
| Database unavailable | Generic temporary-service message |
| Expired or missing session | Redirect home and request login |
| Invalid profile input | Field-specific validation errors |
| Unauthorized profile update | Reject without a database write |

Server logs must not include passwords, password hashes, session cookies,
`DATABASE_URL`, or `AUTH_SECRET`.

## Security Properties and Limitations

- Passwords are one-way hashed with bcrypt.
- Session state is managed by Auth.js cookies rather than browser storage.
- Credential validation runs on the server.
- Private mutations verify the session beside the database operation.
- User id and role are never trusted from client input.
- Login failures do not enumerate registered email addresses.
- Environment secrets are not committed.
- Database access code cannot be bundled into Client Components.

This increment is production-shaped but not production-complete. A public
deployment with password login must additionally provide rate limiting,
monitoring, secure secret rotation, password-reset policy, and a managed
PostgreSQL deployment with backups.

## Dependencies

Expected runtime dependencies:

```text
next-auth
@prisma/client
@prisma/adapter-pg
pg
bcryptjs
zod
```

Expected development dependencies:

```text
prisma
tsx
@types/pg
vitest
```

Implementation pins compatible Prisma 7 package versions and verifies the
current Auth.js installation channel before installation. Package installation
uses `yarn.cmd` on Windows when PowerShell script policy blocks `yarn.ps1`.

## Suggested File Layout

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
  app/
    api/
      auth/
        [...nextauth]/
          route.ts
  server/
    auth/
      password.ts
      sign-in-schema.ts
      profile-schema.ts
      update-profile.ts
    db/
      prisma.ts
  components/
    auth/
      AuthSessionProvider.tsx
      LoginDialog.tsx
      LoginForm.tsx
      AuthStatusButton.tsx
      GlobalLoginDialog.tsx
  types/
    next-auth.d.ts
```

Exact existing component locations remain unchanged unless moving them is
required for a server/client boundary. The implementation avoids unrelated
folder refactors.

## Testing Strategy

Vitest provides focused server-unit coverage. Tests must cover:

- Sign-in schema accepts valid input and rejects malformed input.
- Password hashing and verification succeed for the correct password and fail
  for an incorrect password.
- The seed/upsert contract does not expose plaintext password fields.
- Credential authorization returns safe user fields for a valid account.
- Unknown email and wrong password produce the same public result.
- Profile validation enforces display name, phone, and birth-date rules.
- Unauthorized profile mutation performs no database update.
- Authorized profile mutation always targets the session user.

Manual browser checks cover:

- Global login dialog success and failure states.
- Header transition after login and logout.
- Direct unauthenticated navigation to every `/account/*` page.
- Profile update reflected in profile, sidebar, and header.
- Session restoration after a browser reload.
- Existing cart persistence and collection behavior.

Final verification commands are:

```powershell
docker compose ps
yarn.cmd tsc --noEmit
yarn.cmd lint
yarn.cmd test
yarn.cmd build
```

## Implementation Order

1. Add Docker Compose and verify PostgreSQL health.
2. Install and configure Prisma 7.
3. Add the user schema, migration, and hashed development seed.
4. Add the reusable server-only Prisma client.
5. Add password and credential validation helpers with tests.
6. Configure Auth.js Credentials, JWT/session callbacks, and types.
7. Add the Auth.js route handler and client session provider.
8. Migrate the login dialog and form.
9. Migrate header session display and logout.
10. Add the account proxy and server authorization checks.
11. Migrate profile reads and updates to PostgreSQL.
12. Remove the old Redux/mock auth module after an import audit.
13. Run focused tests and full regression verification.

## Acceptance Criteria

- `docker compose up -d` starts a healthy PostgreSQL service.
- Prisma migration creates the approved `User` schema.
- Seed creates exactly one usable demo account without storing plaintext
  password data.
- Valid credentials sign in through the existing dialog.
- Invalid credentials produce a generic error and no session.
- Auth.js session survives reload without Redux or `sessionStorage` tokens.
- Header and account UI display the authenticated user.
- Logout returns home and invalidates the Auth.js session.
- Unauthenticated users cannot access private account data or mutations.
- Profile updates persist in PostgreSQL and appear across account UI.
- No auth token or password is stored in Redux, local storage, or session
  storage.
- The old mock auth implementation is removed only when unused.
- Cart, product, collection, and global UI behavior have no regression.
- Typecheck, lint, tests, and production build all complete successfully.
