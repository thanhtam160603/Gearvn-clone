# Thử backend trên VPS 512 MB, chưa có domain

Đây là cấu hình **thử nghiệm**. Gateway chỉ bind `127.0.0.1:4000` trên VPS; PostgreSQL và năm service không publish port. Không dùng dữ liệu người dùng thật trước khi có HTTPS, backup và kiểm tra khôi phục.

## 1. Chuẩn bị VPS Ubuntu 24.04

Cài Docker Engine và Compose plugin theo [hướng dẫn Ubuntu chính thức](https://docs.docker.com/engine/install/ubuntu/). Kiểm tra `sudo docker version` phải có cả Client và Server, rồi `sudo docker compose version`.

VPS hiện đã có **1 GB swap** tại `/swapfile`. Kiểm tra bằng `swapon --show`; không tạo lại. Swap chậm hơn RAM và không bảo đảm sáu service chạy ổn định. Trên máy khác chưa có swap, có thể tạo bằng:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
free -h
df -h /
```

Trước khi build, kiểm tra còn ít nhất vài GB đĩa. Nếu VPS đã có swap file ở đường dẫn này thì không chạy lại các lệnh tạo file. Swap tạo bằng các lệnh trên không tự bật lại sau reboot nếu chưa thêm vào `/etc/fstab`.

## 2. Đưa đúng mã nguồn lên VPS

Commit phiên bản backend cần phát hành trên máy phát triển, rồi clone/pull commit đó vào `/opt/gearvn`. Không copy `.env` local, `node_modules`, dump hay private key. Dùng thư mục `/opt/gearvn/secrets` riêng cho env thử nghiệm. Không gửi nội dung env hoặc JWT key qua chat.

```bash
cd /opt/gearvn/backend
bash deploy/create-trial-env.sh
chmod 600 /opt/gearvn/secrets/trial.env
```

Script tạo mật khẩu DB, khóa JWT và các secret khác tại `/opt/gearvn/secrets/trial.env`, không in giá trị ra màn hình. Giá trị `FRONTEND_ORIGIN=http://localhost:3000` chỉ dành cho giai đoạn thử qua SSH tunnel.

## 3. Build, migration, chạy app

Chạy từ `/opt/gearvn/backend`. Lệnh `config --quiet` kiểm tra Compose mà không in các secret đã nội suy.

```bash
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml config --quiet
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml build
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml up -d postgres
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml ps
```

Chỉ tiếp tục khi PostgreSQL báo `healthy`. Sau đó chạy năm migration **theo thứ tự**, mỗi lệnh phải exit 0:

```bash
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml run --rm --no-deps identity-service yarn prisma migrate deploy --config apps/identity-service/prisma.config.ts
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml run --rm --no-deps catalog-service yarn prisma migrate deploy --config apps/catalog-service/prisma.config.ts
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml run --rm --no-deps cart-service yarn prisma migrate deploy --config apps/cart-service/prisma.config.ts
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml run --rm --no-deps order-service yarn prisma migrate deploy --config apps/order-service/prisma.config.ts
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml run --rm --no-deps chat-service yarn prisma migrate deploy --config apps/chat-service/prisma.config.ts
```

Không dùng `db push`, `migrate dev` hoặc development seed trên VPS. Khởi động các ứng dụng:

```bash
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml up -d identity-service catalog-service cart-service order-service chat-service api-gateway
sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml ps
sudo docker stats --no-stream
free -h
df -h /
curl -fsS 'http://127.0.0.1:4000/api/products?pageSize=1' >/dev/null && echo 'Catalog qua Gateway: OK'
```

Nếu build bị kill, app `Exited`, swap dùng liên tục, hoặc đĩa gần đầy: dừng thử và ghi số đo để quyết định tăng gói. Xem log bằng `sudo docker compose --env-file /opt/gearvn/secrets/trial.env -f compose.trial.yaml logs --tail=80 SERVICE_NAME`. Không chạy `down -v`: tùy chọn `-v` xóa volume PostgreSQL.

## 4. Kiểm tra từ máy cá nhân

Mở PowerShell trên máy cá nhân, giữ SSH tunnel này chạy:

```powershell
ssh -N -L 4000:127.0.0.1:4000 SSH_USER@VPS_IP
```

Ở PowerShell khác:

```powershell
Invoke-WebRequest 'http://localhost:4000/api/products?pageSize=1'
```

Tắt backend local trước khi thử để chắc chắn phản hồi đến từ VPS. Vì chưa có domain/HTTPS và `NODE_ENV=production` bật cookie `Secure`, giai đoạn này chỉ nghiệm thu API không cần đăng nhập. Muốn frontend dùng auth, cart cookie và WebSocket từ Internet cần domain, TLS proxy và `FRONTEND_ORIGIN` production chính xác.
