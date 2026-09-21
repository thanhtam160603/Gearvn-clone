# GearVN NestJS Microservices Backend Roadmap

> **For agentic workers:** This roadmap is an index, not an executable task
> list. Execute each linked implementation plan in order. Every plan must pass
> its acceptance gate before the next plan is authored or executed.

**Goal:** Hoàn thiện toàn bộ backend GearVN Clone trước khi bắt đầu tích hợp
frontend.

**Architecture:** Một NestJS monorepo trong `backend/` chứa API Gateway và năm
domain service. Local dùng một PostgreSQL container với database riêng cho từng
service; giao tiếp đồng bộ qua internal HTTP; Socket.IO chỉ dùng cho chat.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Docker Compose, Jest,
Supertest, Socket.IO.

**Spec:**
`docs/superpowers/specs/2026-09-21-nestjs-microservices-backend-design.md`

## Global Constraints

- Không sửa runtime frontend trong `src/` trước backend acceptance gate.
- API Gateway là public entry point duy nhất.
- Mỗi service sở hữu database và Prisma Client riêng.
- Không dùng transaction xuyên database; checkout dùng reservation và bù trừ.
- Không lưu plaintext password, refresh token hoặc secret trong Git.
- WebSocket chỉ phục vụ chat customer-support.
- Trên Windows dùng `yarn.cmd` nếu PowerShell chặn `yarn.ps1`.
- Mỗi task phải giải thích mục tiêu, logic, lưu ý, lệnh kiểm tra và kết quả mong
  đợi.

## Thứ tự plan

### Plan 1: Backend foundation

**File:**
`docs/superpowers/plans/2026-09-21-backend-foundation-plan.md`

Tạo NestJS monorepo, sáu application shell, shared config/common libraries,
public API Gateway baseline, error contract, request ID, Swagger, PostgreSQL
multi-database và Docker Compose.

**Gate:** Sáu app build/test được; Compose khởi động healthy; chỉ Gateway expose
public port; năm database tồn tại.

### Plan 2: Identity service

Được viết sau khi Plan 1 hoàn thành để dùng đúng bootstrap/config interface đã
được kiểm chứng.

Phạm vi: User, RefreshSession, register, login, JWT RS256, refresh rotation,
logout, profile, `CUSTOMER`/`SUPPORT`, seed và authorization contract.

**Gate:** Auth E2E qua Gateway pass; token reuse bị từ chối; support role không
thể được chọn qua public registration.

### Plan 3: Catalog service

Được viết sau Identity để tái sử dụng verified service authentication contract.

Phạm vi: Product, image, specification, category, collection, filter, sort,
pagination, inventory, stock reservation và catalog seed importer.

**Gate:** Catalog public API và internal reservation API pass integration/E2E;
concurrent reservation không làm stock âm.

### Plan 4: Cart service

Được viết sau Catalog vì cart phải kiểm tra product/stock bằng Catalog internal
API.

Phạm vi: guest cart cookie, authenticated cart, item mutation, selected state,
merge idempotent và enriched cart response.

**Gate:** Guest/user/merge flows pass; quantity không vượt stock; selected item
không bị hiểu thành removed item.

### Plan 5: Order và warranty service

Được viết sau Cart và Catalog vì checkout điều phối cả hai service.

Phạm vi: idempotency, stock reservation, local Prisma transactions, compensation,
COD order, snapshot item, order history, cancellation và warranty.

**Gate:** Duplicate checkout không tạo duplicate order; lỗi tạo order release
stock; order history độc lập với catalog thay đổi.

### Plan 6: Chat service và Socket.IO

Được viết sau Identity vì WebSocket handshake và conversation authorization dùng
verified access token/role contract.

Phạm vi: conversation, participant, message, customer/support REST APIs,
Socket.IO namespace, message acknowledgement, reconnect recovery và support
isolation.

**Gate:** Message được persist trước emit; duplicate `clientMessageId` không tạo
duplicate; customer không đọc conversation của người khác.

### Plan 7: Backend integration và hardening

Được viết khi năm domain service đã pass acceptance riêng.

Phạm vi: full E2E flow, service timeout/error mapping, health/readiness,
structured logging, OpenAPI audit, Docker restart/data persistence, security
audit và backend acceptance checklist.

**Gate:** Toàn bộ backend chạy từ clean database bằng documented commands; tất
cả acceptance checks trong spec pass. Sau gate này mới viết frontend integration
spec/plan.

## Commit policy

- Mỗi task có commit riêng sau khi test liên quan pass.
- Không stage thay đổi frontend trong backend commits.
- Trước commit chạy `git diff --cached --name-only` và `git diff --cached --check`.
- Không commit `.env`, private key, token, password production hoặc database
volume.
