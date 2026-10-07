# GearVN storefront

Next.js frontend gọi NestJS API Gateway cho sản phẩm, đăng nhập, giỏ hàng, đặt hàng, hồ sơ và bảo hành. Chat sẽ được nối sau.

## Chạy local trên Windows PowerShell

1. Bật PostgreSQL ở `localhost:5432`. Tạo bốn database `identity_db`, `catalog_db`, `cart_db`, `order_db` với tài khoản khớp các URL trong `backend/apps/<service>/.env`. Không dùng seed này ở production.
2. Trong `backend/`, chạy migration và seed cho dữ liệu phát triển:

```powershell
yarn.cmd prisma migrate deploy --config apps/identity-service/prisma.config.ts
yarn.cmd prisma migrate deploy --config apps/catalog-service/prisma.config.ts
yarn.cmd prisma migrate deploy --config apps/cart-service/prisma.config.ts
yarn.cmd prisma migrate deploy --config apps/order-service/prisma.config.ts
yarn.cmd prisma db seed --config apps/catalog-service/prisma.config.ts
```

3. Từ `backend/`, mở **năm terminal riêng** và chạy mỗi lệnh một terminal:

```powershell
yarn.cmd nest start identity-service --watch
yarn.cmd nest start catalog-service --watch
yarn.cmd nest start cart-service --watch
yarn.cmd nest start order-service --watch
yarn.cmd start:gateway:dev
```

4. Từ thư mục gốc, đặt `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` trong `.env.local`, rồi chạy:

```powershell
yarn.cmd dev
```

Mở `http://localhost:3000`. Dùng `localhost` cho cả frontend và Gateway để browser gửi cookie guest và refresh đúng host. Gateway chạy ở `http://localhost:4000`; Swagger phát triển ở `http://localhost:4000/docs`.

Nếu trang chủ báo lỗi API, kiểm tra PostgreSQL trước: Gateway có thể đang chạy nhưng Catalog trả 500 khi database chưa sẵn sàng. Trang sẽ hiển thị lỗi để thử lại, không chuyển sang sản phẩm mẫu.

## Kiểm tra mã nguồn

```powershell
yarn.cmd tsc --noEmit
yarn.cmd lint
yarn.cmd build
```

Từ `backend/` chạy `yarn.cmd build:all` và `yarn.cmd lint`. Frontend cần biến `NEXT_PUBLIC_API_BASE_URL` khi build và khi chạy. Triển khai production cần HTTPS, cùng site cho shop/API, migrations, backup và nghiệm thu browser theo kế hoạch trong `docs/superpowers/plans/2026-09-23-backend-07-docker-acceptance-plan.md`.
