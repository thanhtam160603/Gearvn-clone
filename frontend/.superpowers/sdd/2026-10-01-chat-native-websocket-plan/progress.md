# SDD ledger — plan: docs/superpowers/plans/2026-10-01-chat-native-websocket-plan.md

Pre-flight: Task 1 ChatWsAdapter is consumed by Task 3 main.ts; constructor and /chat path agree.
Pre-flight: Task 2 ChatWsSessionService is consumed by Task 3 gateway handlers; auth/room interfaces agree.
Pre-flight: Task 3 public events are consumed by Task 4 integration and docs; event/data envelope agrees.
Ruling: Work in current checkout — chat source is untracked and existing Gateway/package files are dirty, so a new worktree would omit the user-authored implementation; cost if wrong: changes share the current branch and need careful scoped review.
Task 1: Ruling: adapter test uses raw HTTP server rather than decorated Nest test app — tsx under this repo compiles test decorators in incompatible mode; the raw server exercises the real WsAdapter upgrade/parser behavior; cost if wrong: Nest decorator wiring remains for Task 3 integration.
Task 1: complete — yarn.cmd tsx --test test/chat-ws-adapter.spec.ts (3 pass); yarn.cmd nest build api-gateway (pass). No commit because plan preserves dirty user work.
Task 2: Ruling: requireAuth throws UnauthorizedException; Gateway handler will send chat.error and close — one layer owns the visible socket response, avoiding duplicate error frames; cost if wrong: a direct service caller must close explicitly.
Task 2: complete — yarn.cmd tsx --test test/chat-ws-session.spec.ts (3 pass); yarn.cmd tsc --noEmit --project apps/api-gateway/tsconfig.app.json (pass).
Task 3: complete — Gateway /chat now uses ChatWsAdapter, session/events services, and JSON event handlers; unit tests, typecheck, and Gateway build passed. Idle JWT expiry also removes sockets from fanout.
Task 4: Removed old Socket.IO adapter and three direct Socket.IO packages; README has browser usage and the older plan marks Socket.IO steps obsolete. Native integration with mock internal HTTP passed (3 cases), both Gateway and Chat Service builds passed, and focused oxlint passed. Real Chat Service/PostgreSQL manual check not run; no data was reset.
