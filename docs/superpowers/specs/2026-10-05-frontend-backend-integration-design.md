# Frontend ↔ Backend Integration Design (without chat)

**Date:** 2026-10-05

**Status:** Awaiting written-spec review
**Scope:** Connect the existing Next.js storefront to the NestJS API Gateway for catalog, identity, cart, checkout, orders, profile, and warranty. Chat, support chat UI, and WebSocket work are deferred.

## Intended result

Customers browse the catalog from `catalog_db`, sign in with Identity, keep a guest or account cart across reloads, select products for checkout without removing the others, place a COD order once, and see their own profile, orders, and warranty requests. The first acceptance run is local. Production acceptance follows the existing Docker/deployment plan after the local flows pass and hosting, domains, TLS, and backups exist. A successful frontend build alone does not count as production acceptance.

The current frontend uses `src/data/products.ts`, `mockAuthService`, browser cart persistence, and empty account fixtures. The confirmation step does not send an order. The Gateway already exposes the necessary REST routes; catalog has a 114-product development fixture whose product IDs match the frontend seeds. Existing uncommitted backend work belongs to the user and must not be overwritten.

## Approach and boundaries

The browser calls the API Gateway directly through one typed HTTP client using `NEXT_PUBLIC_API_BASE_URL` (an origin, for example `http://localhost:4000`; route paths retain `/api`). Public catalog requests in Next server components use the same Gateway and do not touch service databases. Authenticated browser requests attach an access token held only in memory. Requests that need guest or refresh cookies use `credentials: 'include'`. The client parses the Gateway error envelope, exposes status and code, and retries an authenticated request at most once after a single shared refresh operation. It never refreshes recursively or changes a failed mutation into success.

Use `localhost` consistently for both local browser origins; `localhost` and `127.0.0.1` are distinct cookie hosts. In production, `shop.<domain>` and `api.<domain>` must be HTTPS under the same site, with Gateway `FRONTEND_ORIGIN` set to the exact shop origin. The existing `SameSite=Lax`, `Secure` production refresh and guest cookies remain HttpOnly; no token goes into localStorage, sessionStorage, or a URL. Do not add a Next proxy or expose internal service URLs in the browser.

The integration uses these boundaries:

| Unit | Responsibility |
| --- | --- |
| `src/lib/api/*` | Gateway URL, typed transport, DTO parsing/mapping, and domain request functions |
| Catalog pages/components | Server-render public products and collections from Gateway; preserve URL filters, sort, and pagination |
| Auth state/components | Bootstrap from refresh cookie, login/register/logout, refresh, profile update, and account gating |
| Cart state/components | Display the server cart, perform server mutations, merge guest cart, and migrate legacy browser cart once |
| Checkout/account pages | Submit an order and show server orders/warranties; never invent server state from mock fixtures |

Existing components can keep their visual layout, but their data owners change. Avoid a permanent mock/API toggle or silent fallback to seed data when the Gateway fails: show a retryable error instead. Remove mock account credentials from the login form when real login is wired.

## Catalog

`GET /api/products` returns a paged list of product summaries. `GET /api/products/:slug` returns detail. `GET /api/categories` and `GET /api/collections/:slug` supply navigation and collection content. The frontend maps DTOs at one boundary, distinguishing summary fields from detail-only fields instead of making up detail arrays for cards. Product detail routes no longer use static seed lookup or `generateStaticParams`; a real 404 uses Next `notFound()`, while network/server failure shows an error state rather than a false 404.

Homepage sections and similar products need a section-scoped catalog query. Add an optional validated `section` parameter to `GET /api/products` in Catalog, then request a bounded page per section. Keep the existing page/pageSize limits. The section identifier comes from the existing section configs, not arbitrary user input. Collection title, banner, filter definitions/options, page of products, and totals come from `GET /api/collections/:slug`. The URL remains the source of filter/sort/page state; translate the frontend filter IDs and comma-separated choices to the backend query contract. Use the backend's `totalPages` and `totalItems`, not a second frontend slice. A missing collection is 404; an empty valid collection shows the empty state.

The catalog development fixture is for local acceptance. Production needs a separately reviewed, idempotent catalog import; the development seed must not run in production.

## Identity and profile

`POST /api/auth/login` and `POST /api/auth/register` return `{ user, accessToken, accessTokenExpiresAt }` and set the refresh cookie. On page load, `POST /api/auth/refresh` restores a session from that cookie. Only the access token and user live in Redux memory. If refresh returns 401, the user is signed out; if the Gateway is unavailable, show a retryable session error instead of treating the user as logged out. A shared refresh promise prevents concurrent refresh-token rotation races. `POST /api/auth/logout` clears the server cookie and local state; local state still clears if the network call fails, and the UI reports the server failure.

Map Identity role `CUSTOMER` and nullable `birthDate` to frontend types explicitly. `GET /api/users/me` supplies the current profile; `PATCH /api/users/me` sends `{ name, phone, birthDate }`, mapping the current `displayName` field to `name`. The current service cannot clear `birthDate` safely (`null` reaches `new Date(null)`), so add an explicit nullable DTO/service path and test clearing it before enabling that form action. Do not persist the old mock session. Add a small real registration form because the mock credentials will be removed and a customer needs a path to create an account. Account pages remain gated on authenticated customer state.

## Cart and checkout

`GET /api/cart` returns the canonical cart view with item metadata, `selected`, `canCheckout`, `subtotal`, and `selectedSubtotal`. Guest ownership comes from the signed HttpOnly guest cookie; signed-in ownership comes from Bearer. All cart reads/mutations include credentials, and signed-in requests also include Bearer. Add, set quantity, select, remove, clear, and merge use the Gateway's existing `/api/cart` routes. These mutations return only cart ID/version (and merge clamp IDs), so refetch `GET /api/cart` after each successful mutation. Replace the static product join in `cart-selectors.ts` with the returned cart metadata. Show unavailable items rather than deleting them. On mutation failure retain the previous cart and show the error.

Preserve the existing browser cart once during the move to server state. On first load, read and validate `gearvn-cart`, fetch the server cart, and for each valid legacy product use the server quantity if higher; add missing items or set quantity to the higher value. This makes retry after a partial transfer non-additive. Skip malformed entries; a product rejected as missing is reported and skipped instead of blocking every future load. Remove the legacy key only after all applicable items have been reconciled. On login/register, call `POST /api/cart/merge` once with both guest cookie and new Bearer, then refetch `GET /api/cart`. A reload must not duplicate lines. `selected` is stored by Cart Service; unselecting only updates selection. The explicit “delete selected” button still deletes those lines. Totals use server prices.

Checkout requires login and at least one selected item with `canCheckout=true` and `status='in-stock'`. The current shipping form needs `recipientName`, `phone`, `addressLine`, `ward`, `district`, `city`, optional `note`, and `paymentMethod: 'COD'`. Unsupported delivery or shipping choices must not be presented as working order options. The confirmation step displays the server cart amount and calls `POST /api/orders` with one UUID `Idempotency-Key` retained for retries of the same unchanged order. Disable duplicate clicks while pending. A `completed` result shows the server order; a `pending` result keeps the key and explains that processing continues, then queries orders rather than creating another checkout with a new key. A changed address/cart creates a new attempt/key only after the previous outcome is resolved. After completion, refetch Cart: the backend cleanup determines which selected lines were removed; never clear the full cart in the frontend.

## Orders and warranty

`GET /api/orders` and `GET /api/warranties` replace the empty account fixtures. Map backend status enums to visible Vietnamese labels without inventing a `returned` order status. Use backend pagination and provide loading, empty, error, and retry states. An order can be opened via `GET /api/orders/:id`; first correct the current Order Service detail query from the nonexistent `orderId` field to `id` and verify ownership. Cancellation uses `POST /api/orders/:id/cancel` only from a state the backend accepts. Warranty creation sends `{ orderItemId, reason, description? }` for an eligible delivered order item; list/detail come from the Warranty API. The frontend must show 400/401/409 responses as actionable validation, session, or conflict messages. Access to another user's order/warranty remains enforced by backend Bearer auth.

## Acceptance and sequencing

1. Confirm Gateway and five non-chat services start against their own local databases and Catalog fixture. Record any pre-existing backend build/test failures separately; do not alter unrelated uncommitted chat work.
2. Implement the shared API client and Catalog. Verify homepage, collection URL filters/sort/page, product detail, 404, and API-unavailable states.
3. Implement Identity/profile and the registration/login/logout/refresh flow. Verify reload, expired access token, refresh failure, and profile save.
4. Implement server Cart and one-time local cart transfer. Verify guest reload, add/quantity/remove, selectedSubtotal, guest-to-user merge, and no duplicate lines after reload.
5. Implement COD checkout, orders, and warranty. Verify one order for retried idempotency key, unselected lines retained, and real account lists.
6. Run focused tests for DTO mapping, request/cookie/refresh behavior, cart migration and selection, checkout retry state, plus frontend typecheck/lint/build and backend checks for any changed backend code. Then exercise the complete local journey in a browser with DevTools Network.
7. Follow `docs/superpowers/plans/2026-09-23-backend-07-docker-acceptance-plan.md` for infrastructure, HTTPS, backup/restore, and production browser acceptance. Production work is not complete until the site works with the local machine off.

Before any frontend build/deployment, remove the untracked `public/ssh-key-2026-10-05.key` from the web-served `public` tree and keep the key outside the repository. Do not read it into logs or commit it. The key is currently not ignored by Git. This security cleanup must preserve the user's access to the original file.

## Deferred

Customer chat UI, support console, WebSocket reconnect/history, and any chat backend changes are outside this integration. No chat import, package, route, or UI placeholder is needed to accept the REST flows above.
