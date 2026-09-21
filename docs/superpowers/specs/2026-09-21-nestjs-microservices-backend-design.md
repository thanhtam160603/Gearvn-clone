# Thiết kế backend NestJS microservices cho GearVN Clone

**Ngày:** 2026-09-21
**Trạng thái:** Chờ duyệt
**Phạm vi:** Chỉ xây dựng backend; chưa thay đổi runtime frontend trong `src/`

## 1. Mục tiêu

Xây dựng backend đầy đủ cho GearVN Clone bằng NestJS, Prisma, PostgreSQL và
Docker. Backend thay thế dần dữ liệu mock, Auth.js/Prisma đặt trong Next.js và
cart lưu hoàn toàn ở trình duyệt, nhưng việc tích hợp frontend chỉ bắt đầu sau
khi toàn bộ backend đã được dựng và kiểm tra độc lập.

Backend phải cung cấp:

- đăng ký, đăng nhập, refresh token, đăng xuất và hồ sơ người dùng;
- sản phẩm, danh mục, collection, bộ lọc, sắp xếp và tồn kho;
- giỏ hàng khách vãng lai và người dùng đã đăng nhập;
- checkout, đơn hàng, lịch sử trạng thái và yêu cầu bảo hành;
- chat hỗ trợ 1-1 giữa khách hàng đã đăng nhập và nhân viên hỗ trợ;
- API Gateway, tài liệu OpenAPI, health check, logging và error contract thống
  nhất.

Mục tiêu học tập là hiểu rõ trách nhiệm của từng tầng, transaction cục bộ,
giao tiếp xuyên service, JWT, WebSocket và cách đóng gói bằng Docker. Kế hoạch
triển khai sau spec phải giải thích mục tiêu, logic, code quan trọng, lưu ý, lỗi
thường gặp và cách kiểm tra của từng task.

## 2. Quyết định đã chốt

- Dùng kiến trúc microservice triển khai tuần tự, không dựng mọi service cùng
  lúc.
- Backend nằm trong thư mục `backend/`; ứng dụng Next.js hiện tại tiếp tục nằm
  ở thư mục gốc.
- Frontend chỉ gọi API Gateway, không gọi trực tiếp service nội bộ.
- Dùng NestJS, Prisma, PostgreSQL và Docker Compose.
- Local development dùng một PostgreSQL container nhưng database riêng cho
  từng service.
- Request cần kết quả ngay dùng HTTP nội bộ. Chỉ bổ sung RabbitMQ khi xuất hiện
  consumer bất đồng bộ cụ thể; không thêm broker chỉ để minh họa.
- Dùng Prisma transaction trong từng database. Checkout xuyên Catalog và Order
  sử dụng reservation, idempotency và hành động bù trừ.
- Backend được hoàn thành và kiểm tra trước; chưa sửa runtime frontend trong
  `src/`.
- Giai đoạn frontend sau này dùng Axios + RTK Query cho Client Component và
  native `fetch` cho Server Component.
- WebSocket chỉ phục vụ chat hỗ trợ, không dùng cho trạng thái đơn hàng hoặc
  thông báo tài khoản.
- Không xây admin dashboard đầy đủ. Frontend sau này chỉ thêm màn hình tối giản
  `/support/chats` cho nhân viên hỗ trợ.

## 3. Những phần không thuộc phạm vi backend đầu tiên

- OAuth, email verification, quên mật khẩu và 2FA.
- Thanh toán trực tuyến; phiên bản đầu chỉ hỗ trợ COD.
- Voucher, loyalty, wishlist và review sản phẩm.
- Chatbot AI, guest chat, gửi file/ảnh, gọi thoại/video, typing indicator và
  read receipt chi tiết.
- Admin dashboard quản lý sản phẩm, đơn hàng hoặc doanh thu.
- Kubernetes, service mesh, tracing phân tán và autoscaling.
- Event-driven saga đầy đủ bằng RabbitMQ cho checkout.

## 4. Kiến trúc tổng thể

```text
Next.js
   |
   | REST / Socket.IO
   v
API Gateway
   |-- Identity Service ---- identity_db
   |-- Catalog Service ----- catalog_db
   |-- Cart Service -------- cart_db
   |-- Order Service ------- order_db
   `-- Chat Service -------- chat_db
```

API Gateway là process duy nhất expose public port. Các service còn lại chỉ
truy cập được trên Docker network. Mỗi service sở hữu Prisma schema, migrations
và Prisma Client riêng; không service nào import generated client hoặc truy cập
database của service khác.

### 4.1 Cấu trúc thư mục

```text
backend/
  apps/
    api-gateway/
    identity-service/
    catalog-service/
    cart-service/
    order-service/
    chat-service/
  libs/
    contracts/
    config/
    auth/
    common/
  scripts/
  package.json
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  Dockerfile
  .env.example
```

`libs/contracts` chỉ chứa DTO/event contract và type dùng chung, không chứa
Prisma model hoặc nghiệp vụ. `libs/common` chứa error envelope, request ID,
logging và health utilities. `libs/auth` chứa logic xác minh access token bằng
public key, không chứa logic đăng nhập hoặc password.

## 5. Trách nhiệm của các service

### 5.1 API Gateway

- Cung cấp public REST API dưới `/api`.
- Cấu hình CORS, rate limit, request ID và Swagger/OpenAPI.
- Xác minh access token và chuyển user context tới service nội bộ.
- Định tuyến request tới service tương ứng với timeout rõ ràng.
- Chuẩn hóa lỗi nội bộ thành public error contract.
- Giữ Socket.IO connection cho chat và chuyển message đã xác thực tới Chat
  Service.
- Không chứa Prisma Client và không thực hiện nghiệp vụ/domain transaction.

### 5.2 Identity Service

- Đăng ký tài khoản `CUSTOMER`.
- Đăng nhập bằng email/password.
- Phát access token và rotate refresh token.
- Đăng xuất, thu hồi refresh session và quản lý hồ sơ.
- Quản lý role `CUSTOMER` và `SUPPORT`.
- Không cho client tự chọn role khi đăng ký.

Database `identity_db` có tối thiểu:

```text
User
RefreshSession
```

Tài khoản `SUPPORT` chỉ được tạo bằng seed hoặc công cụ nội bộ trong tương lai.

### 5.3 Catalog Service

- Product, image, specification, category và collection.
- Product detail, filter, sort và pagination.
- Giá hiện tại và tồn kho.
- Stock reservation cho checkout.
- Seed dữ liệu từ catalog mock hiện tại sau khi ánh xạ dữ liệu được xác nhận.

Database `catalog_db` có tối thiểu:

```text
Product
ProductImage
ProductSpec
Category
Collection
CollectionProduct
Inventory
StockReservation
StockReservationItem
```

Inventory được giữ trong Catalog Service ở phiên bản đầu để tránh tách thêm
Inventory Service khi chưa có nhu cầu độc lập.

### 5.4 Cart Service

- Cart của khách vãng lai và người dùng đã đăng nhập.
- Thêm, sửa số lượng, xóa và chọn/bỏ chọn item.
- Merge guest cart vào user cart sau khi đăng nhập.
- Không cho quantity âm, bằng 0 hoặc vượt tồn kho đã xác nhận.
- Giữ nguyên ý nghĩa hiện tại: chọn item để checkout không đồng nghĩa xóa item.

Database `cart_db` có tối thiểu:

```text
Cart
CartItem
```

Cart chỉ lưu `productId`, `quantity` và `selected`. Tên, ảnh, giá và stock thuộc
Catalog Service. Guest cart được nhận diện bằng opaque cart session cookie; trình
duyệt không cần đọc giá trị cookie.

### 5.5 Order Service

- Validate checkout input và idempotency key.
- Điều phối stock reservation với Catalog Service.
- Tạo Order, OrderItem snapshot, địa chỉ và lịch sử trạng thái.
- Hỗ trợ COD, danh sách đơn, chi tiết đơn và hủy đơn theo rule.
- Tạo và đọc yêu cầu bảo hành liên quan đến order item.

Database `order_db` có tối thiểu:

```text
Order
OrderItem
OrderAddress
OrderStatusHistory
CheckoutRequest
WarrantyRequest
```

OrderItem lưu snapshot `productId`, `sku`, `productName`, `image`, `unitPrice`
và `quantity`; lịch sử đơn không phụ thuộc catalog có thay đổi sau đó.

### 5.6 Chat Service

- Một cuộc hội thoại hỗ trợ đang mở cho mỗi khách hàng.
- Lưu conversation, participant và message.
- Kiểm tra khách chỉ đọc/gửi vào conversation của mình.
- Cho phép role `SUPPORT` xem danh sách, tham gia và đóng conversation.
- Lưu message thành công trước khi API Gateway phát Socket.IO event.

Database `chat_db` có tối thiểu:

```text
Conversation
ConversationParticipant
Message
```

Phiên bản đầu chỉ hỗ trợ text message. Lịch sử được tải bằng REST; Socket.IO chỉ
truyền message mới và acknowledgement.

## 6. Authentication và authorization

### 6.1 Token

- Access token là JWT sống khoảng 15 phút, trả trong response body.
- Refresh token sống khoảng 7 ngày, nằm trong cookie `HttpOnly`.
- Chỉ lưu hash refresh token trong `identity_db`.
- Refresh token được rotate; reuse token cũ làm session bị thu hồi.
- Production cookie dùng `Secure=true`, `SameSite=Lax`; local HTTP dùng
  `Secure=false`.
- Không log password hoặc token.

Identity Service ký JWT bằng private key. API Gateway và service cần xác minh
authorization sử dụng public key; không phân phối private signing key cho các
service khác.

### 6.2 Phân quyền

- Public registration luôn tạo `CUSTOMER`.
- `/support/*` yêu cầu role `SUPPORT`.
- User ID và role lấy từ token đã xác minh, không lấy từ request body.
- Frontend guard sau này chỉ phục vụ UX; backend authorization là bắt buộc.
- API Gateway xác thực ở biên, nhưng service vẫn kiểm tra quyền sở hữu tài
  nguyên đối với cart, order, warranty và conversation.

### 6.3 Endpoint auth dự kiến

```text
POST  /api/auth/register
POST  /api/auth/login
POST  /api/auth/refresh
POST  /api/auth/logout
GET   /api/users/me
PATCH /api/users/me
```

## 7. API contract chính

### 7.1 Catalog

```text
GET /api/products
GET /api/products/:slug
GET /api/categories
GET /api/collections/:slug
```

Danh sách hỗ trợ pagination, filter và sort bằng query string. API trả metadata
`page`, `pageSize`, `totalItems` và `totalPages`.

### 7.2 Cart

```text
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:productId
DELETE /api/cart/items/:productId
PATCH  /api/cart/items/:productId/selection
POST   /api/cart/merge
DELETE /api/cart
```

Mọi mutation cart trả cart state mới hoặc version mới để client không phải đoán
trạng thái server.

### 7.3 Order và warranty

```text
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
POST /api/orders/:id/cancel

POST /api/warranties
GET  /api/warranties
GET  /api/warranties/:id
```

`POST /api/orders` yêu cầu header `Idempotency-Key`. Cùng user và key phải trả
cùng kết quả thay vì tạo thêm order.

### 7.4 Chat

```text
POST /api/chat/conversations
GET  /api/chat/conversations/current
GET  /api/chat/conversations/:id/messages

GET  /api/support/conversations
GET  /api/support/conversations/:id/messages
POST /api/support/conversations/:id/close
```

Socket namespace `/chat` dùng các event:

```text
chat.message.send
chat.message.ack
chat.message.created
chat.error
```

Gateway lấy identity từ JWT handshake và tự join room theo user/conversation đã
được Chat Service cho phép. Client không được tự chọn một `userId` tùy ý để join.

## 8. Checkout, transaction và consistency

Prisma transaction chỉ bao phủ các query của một Prisma Client trên một
database. Không thực hiện network request chậm bên trong interactive
transaction và không truy cập database service khác.

Luồng checkout:

1. API Gateway chuyển request đã xác thực và `Idempotency-Key` tới Order
   Service.
2. Order Service tìm `CheckoutRequest` cùng user/key; nếu đã hoàn thành thì trả
   lại order cũ.
3. Order Service yêu cầu Catalog Service tạo stock reservation.
4. Catalog Service transaction cục bộ kiểm tra đủ stock, giảm available, tăng
   reserved và tạo reservation.
5. Order Service transaction cục bộ tạo Order, items snapshot, address, status
   history và hoàn thành CheckoutRequest.
6. Tạo order thành công thì Catalog Service confirm reservation.
7. Tạo order thất bại thì Order Service yêu cầu release reservation; Catalog
   transaction hoàn trả stock.
8. Sau khi order chắc chắn được tạo, Cart Service mới xóa các item đã checkout;
   lỗi cleanup cart không được làm mất order và có thể retry idempotently.

Reservation có trạng thái `PENDING`, `CONFIRMED`, `RELEASED`, `EXPIRED` và thời
hạn. Worker của Catalog Service giải phóng reservation `PENDING` quá hạn để
không khóa tồn kho vĩnh viễn.

## 9. Chat realtime

1. Client lấy conversation/message history qua REST.
2. Client mở một Socket.IO connection tới API Gateway bằng access token.
3. Gateway xác minh JWT và yêu cầu Chat Service kiểm tra quyền conversation.
4. Khi nhận `chat.message.send`, Gateway chuyển command kèm sender identity tới
   Chat Service.
5. Chat Service validate nội dung/quyền, lưu message trong transaction rồi trả
   persisted message.
6. Gateway phát `chat.message.ack` cho sender và `chat.message.created` tới room
   của các participant.
7. Khi reconnect, client gọi lại REST để lấy các message bị bỏ lỡ. PostgreSQL là
   source of truth; WebSocket không phải hàng đợi bền vững.

Socket message có `clientMessageId` để retry không tạo bản ghi trùng. Database
đặt unique constraint theo sender và `clientMessageId`.

## 10. Error handling

Public error response dùng một dạng thống nhất:

```json
{
  "statusCode": 409,
  "code": "INSUFFICIENT_STOCK",
  "message": "Sản phẩm không còn đủ số lượng.",
  "requestId": "req_123",
  "details": []
}
```

- Không trả Prisma error, stack trace hoặc internal hostname cho client.
- Validation trả `400`; thiếu authentication `401`; thiếu quyền `403`; không
  tìm thấy `404`; xung đột nghiệp vụ `409`; dependency timeout `503` hoặc `504`.
- Request ID được tạo ở Gateway và truyền qua header tới service nội bộ.
- Retry chỉ áp dụng cho operation idempotent. Không tự retry `POST /orders` nếu
  không có idempotency key.
- Internal HTTP client có connect/read timeout. Dependency failure được log cùng
  request ID và tên service.

## 11. Quan sát và vận hành

- Mỗi process cung cấp `/health/live` và `/health/ready` nội bộ.
- Log có cấu trúc gồm timestamp, level, service, requestId, route, status và
  duration; redact password/token/cookie.
- API Gateway cung cấp Swagger cho public contract. Internal endpoint có tài
  liệu riêng hoặc bị ẩn khỏi public Swagger.
- Chỉ API Gateway expose port public trong Compose; PostgreSQL có thể expose cho
  local debugging nhưng không dùng cấu hình đó trong production.
- Migrations chạy rõ ràng cho từng service; không để nhiều replica tự chạy
  `migrate dev` khi khởi động.

## 12. Kiểm thử và xác minh backend-first

Backend được kiểm tra độc lập trước khi sửa frontend:

- Unit test cho rule quan trọng: password validation, order transition, cart
  quantity, reservation và authorization.
- Integration test cho repository/Prisma với PostgreSQL test database.
- E2E test qua API Gateway cho auth, catalog, cart, checkout, warranty và chat
  authorization.
- Socket.IO test client cho chat hai chiều, reconnect, duplicate
  `clientMessageId` và cross-user isolation.
- Swagger, `curl`/PowerShell và Prisma Studio hỗ trợ kiểm tra thủ công, nhưng
  không thay thế toàn bộ automated verification của nghiệp vụ quan trọng.

Các tiêu chí bắt buộc trước frontend:

- Compose services healthy và dựng được từ database rỗng.
- Migration và seed chạy lặp lại có kiểm soát, không tạo bản ghi trùng.
- Chỉ Gateway public; service không đọc database của nhau.
- Auth, refresh rotation, role và ownership guard hoạt động.
- Concurrent cart/stock request không tạo quantity âm.
- Cùng idempotency key không tạo hai order.
- Checkout failure giải phóng reservation.
- Chat lưu message trước khi emit và user không đọc conversation của người khác.
- Restart container không làm mất dữ liệu PostgreSQL.
- Không commit secret hoặc plaintext password ngoài development seed được ghi
  rõ mục đích.

## 13. Trình tự triển khai backend

1. NestJS monorepo, config, Docker, PostgreSQL bootstrap, Gateway foundation.
2. Identity Service và JWT authorization nền tảng.
3. Catalog Service, inventory và seed catalog.
4. Cart Service, guest session và merge.
5. Order Service, warranty, idempotency và stock reservation/compensation.
6. Chat Service, Socket.IO Gateway và support role flow.
7. Cross-service hardening, OpenAPI, logging, health, integration/e2e checks.
8. Backend acceptance gate.

Mỗi giai đoạn có migration, seed/fixture, contract, verification và commit riêng.
Không bắt đầu frontend integration trước khi giai đoạn 8 đạt yêu cầu.

## 14. Ảnh hưởng tới source hiện tại

Trong backend plan không sửa runtime dưới `src/`. Các file sau vẫn được giữ để
frontend hoạt động trong thời gian backend được dựng:

- Auth.js/Prisma hiện tại trong Next.js;
- auth mock bằng Redux/sessionStorage;
- product/collection mock data;
- cart Redux và `CartPersistence`;
- account order/warranty mock.

Sau backend acceptance sẽ tạo một spec và plan frontend riêng. Giai đoạn đó mới
kết nối Axios + RTK Query + Socket.IO client, rồi xóa Auth.js, Prisma trong
Next.js và mock implementation theo từng module đã thay thế thành công.

Spec và plan Auth.js/PostgreSQL/Prisma ngày 2026-09-16 được xem là phương án cũ
đã bị thay thế về kiến trúc; tài liệu được giữ lại làm lịch sử, không tiếp tục
thực thi.
