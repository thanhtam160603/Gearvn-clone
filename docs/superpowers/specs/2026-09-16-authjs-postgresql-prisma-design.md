# Thiết kế xác thực bằng Auth.js, PostgreSQL và Prisma

## Mục tiêu

Thay thế module xác thực mock chỉ chạy trên trình duyệt bằng cơ chế đăng nhập
email/mật khẩu thật, có dữ liệu được lưu trong PostgreSQL. Auth.js quản lý vòng
đời phiên đăng nhập, Prisma chịu trách nhiệm truy cập cơ sở dữ liệu, còn dialog
đăng nhập và các trang tài khoản theo giao diện GearVN hiện tại vẫn được giữ
làm trải nghiệm phía người dùng.

Giai đoạn đầu tiên hỗ trợ tài khoản được seed sẵn, đăng nhập, đăng xuất, bảo vệ
các trang tài khoản và lưu thay đổi thông tin cá nhân. Đăng ký, quên mật khẩu,
xác minh email, OAuth và quản trị phân quyền không thuộc phạm vi giai đoạn này.

## Các quyết định đã duyệt

- Giữ frontend và backend trong cùng dự án Next.js App Router.
- Chạy PostgreSQL 17 cục bộ bằng Docker Desktop và Docker Compose.
- Dùng Prisma ORM 7 vì hướng dẫn tích hợp Auth.js hiện tại vẫn dựa trên Prisma
  Client 7.
- Dùng Auth.js Credentials Provider với chiến lược JWT session.
- Truy vấn trực tiếp bảng `User` bằng Prisma trong hàm `authorize()`.
- Chưa thêm `@auth/prisma-adapter` trong giai đoạn chỉ dùng Credentials.
- Hash mật khẩu bằng `bcryptjs`; tuyệt đối không lưu mật khẩu dạng plaintext.
- Seed một tài khoản phát triển thay vì xây dựng chức năng đăng ký ngay.
- Auth.js là nguồn sự thật duy nhất của trạng thái xác thực trong runtime.
- Tiếp tục dùng Redux Toolkit cho cart và trạng thái UI, bao gồm dialog đăng
  nhập toàn cục.
- Chỉ xóa auth slice và vòng đời mock token sau khi toàn bộ nơi sử dụng đã được
  chuyển sang Auth.js.

## Bối cảnh hiện tại

Dự án đang dùng Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4,
Redux Toolkit, Headless UI và Yarn 4. Xác thực hiện tại được mô phỏng hoàn toàn
trên trình duyệt:

- `src/store/auth-slice.ts` quản lý user, access token, refresh token, thời gian
  hết hạn, các thao tác bất đồng bộ và cập nhật profile.
- `src/lib/mock-auth-service.ts` so sánh thông tin đăng nhập với dữ liệu trong
  source và tạo token mock.
- `src/lib/auth-storage.ts` lưu snapshot phiên đăng nhập vào `sessionStorage`.
- `src/components/auth/AuthBootstrap.tsx` khôi phục và refresh snapshot đó.
- `src/components/auth/AuthGate.tsx` bảo vệ giao diện account ở phía client.
- `src/data/auth-users.ts` chứa tài khoản phát triển trong source code.

Giao diện account, login dialog, hành vi cart, collection và UI slice toàn cục
phải tiếp tục hoạt động trong suốt quá trình chuyển đổi.

## Phạm vi

### Bao gồm

- PostgreSQL container cục bộ và Docker volume lưu dữ liệu bền vững.
- Prisma schema, migration, generated client và development seed.
- Auth.js Credentials Provider và session cookie dựa trên JWT.
- Kiểm tra credentials và mật khẩu ở phía server.
- Route Handler của Auth.js.
- Mở rộng TypeScript type cho Auth.js session.
- `SessionProvider` phía client cho header và dialog có tương tác.
- Tích hợp `signIn()` vào login dialog hiện tại.
- Tích hợp `useSession()` và `signOut()` vào header và account menu.
- Bảo vệ dữ liệu và mutation của account ở phía server.
- Route guard bằng `proxy.ts` của Next.js 16.
- Đọc và cập nhật profile trong PostgreSQL.
- Xóa module auth mock sau khi quá trình chuyển đổi hoàn tất.
- Unit test tập trung và kiểm tra đầy đủ typecheck, lint, build.

### Không bao gồm

- Đăng ký tài khoản công khai.
- Quên mật khẩu và đặt lại mật khẩu.
- Xác minh email.
- Google, GitHub hoặc các OAuth provider khác.
- Passkey, magic link và xác thực hai lớp.
- Hạ tầng rate limit dùng cho production.
- Lưu đơn hàng, bảo hành hoặc thanh toán thật.
- Trang quản trị hoặc UI quản lý role.
- Triển khai PostgreSQL hoặc ứng dụng Next.js lên production.

## Kiến trúc

```text
LoginForm
   |
   | signIn("credentials")
   v
Auth.js Route Handler
/api/auth/[...nextauth]
   |
   v
Credentials.authorize()
   |-- Zod kiểm tra email và password
   |-- Prisma tìm User theo email đã chuẩn hóa
   `-- bcryptjs kiểm tra passwordHash
          |
          v
      PostgreSQL
          |
          v
Auth.js tạo JWT session cookie được mã hóa
          |
          |-- auth() cho code phía server
          `-- useSession() cho UI tương tác phía client
```

Module chỉ có một nguồn sự thật về đăng nhập: Auth.js session. Redux không sao
chép session và không lưu authentication token.

## PostgreSQL cục bộ

Repository sẽ có file `compose.yaml` chứa một PostgreSQL service:

```text
Image: postgres:17-alpine
Container name: gearvn-postgres
Database: gearvn
User: gearvn
Host port: 5432
Container port: 5432
Volume: gearvn_postgres_data
Healthcheck: pg_isready
```

Named volume giữ dữ liệu sau khi restart container hoặc chạy
`docker compose down`. Xóa volume là thao tác phá hủy dữ liệu và không thuộc
quy trình làm việc thông thường.

Thông tin đăng nhập database cục bộ chỉ dùng cho môi trường phát triển.
`.env.local` bị Git bỏ qua, còn `.env.example` chỉ ghi tên biến cần thiết mà
không chứa secret.

## Mô hình dữ liệu Prisma

Migration đầu tiên chỉ chứa model người dùng cần thiết cho Credentials flow:

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

`email` được chuẩn hóa bằng `trim().toLowerCase()` trước khi truy vấn và seed.
`birthDate` dùng kiểu date của PostgreSQL, không phải timestamp. Tầng Prisma
chuyển đổi giá trị này sang và từ định dạng `YYYY-MM-DD` mà form hiện tại dùng.

Schema ban đầu không có các model `Account`, `Session` và `VerificationToken`
của Auth.js. Các model này chỉ cần thiết khi một giai đoạn sau bổ sung OAuth
hoặc database session.

## Development seed

`prisma/seed.ts` tạo hoặc cập nhật một tài khoản phát triển bằng `upsert`:

```text
Email: demo@gearvn.local
Mật khẩu: Demo@123
Tên hiển thị: Demo Customer
Role: CUSTOMER
```

Seed phải hash mật khẩu bằng bcrypt trước khi ghi. Chạy seed nhiều lần không
được tạo user trùng. Log và các field trong database không được chứa mật khẩu
plaintext ngoài đầu vào phát triển được truyền trực tiếp vào hàm hash.

## Ranh giới Prisma Client

`src/server/db/prisma.ts` tạo PostgreSQL driver adapter và Prisma Client. Trong
môi trường development, một client được tái sử dụng qua global cache để hot
reload không tạo quá nhiều kết nối database. Đây là module server-only và
không được import vào Client Component.

Mọi thao tác database phải nằm trong server module, Server Action, Route
Handler hoặc callback của Auth.js. React client không bao giờ import Prisma.

## Cấu hình Auth.js

`src/auth.ts` export các hàm `handlers`, `auth`, `signIn` và `signOut` từ
Auth.js. Credentials Provider khai báo hai field `email` và `password`.

Luồng của `authorize()`:

1. Parse credentials bằng Zod sign-in schema dùng chung.
2. Chuẩn hóa email.
3. Dùng Prisma tìm user theo unique email.
4. Dùng bcrypt so sánh password gửi lên với `passwordHash`.
5. Trả `null` cho mọi trường hợp thông tin đăng nhập không hợp lệ.
6. Chỉ trả các field nhận diện an toàn khi đăng nhập thành công.

Email không tồn tại và password sai phải có cùng lỗi công khai để form không
tiết lộ tài khoản nào đang tồn tại.

Chiến lược session là `jwt`. JWT callback và session callback chỉ công khai:

```ts
{
  id: string;
  email: string;
  displayName: string;
  role: "CUSTOMER";
}
```

Các callback không được công khai `passwordHash`, dữ liệu kết nối database hay
secret của ứng dụng. `src/types/next-auth.d.ts` mở rộng type của Auth.js cho
các field này.

## Auth.js Route Handler và provider phía client

`src/app/api/auth/[...nextauth]/route.ts` re-export hai handler `GET` và `POST`
của Auth.js.

Một client provider nhỏ bọc `SessionProvider` của Auth.js. Provider này được
mount bên trong cây `StoreProvider` hiện tại và không thay thế Redux. Component
có tương tác dùng `useSession()`; Server Component và server mutation ưu tiên
dùng `auth()`.

Root layout không gọi server session chỉ để khởi tạo mọi trang public, vì cách
đó khiến toàn ứng dụng phụ thuộc không cần thiết vào request-time auth. Header
có thể tải client session, trong khi code server được bảo vệ luôn tự kiểm tra
session độc lập.

## Luồng đăng nhập

Giữ nguyên giao diện của `LoginDialog` và `LoginForm`. Form không còn dispatch
Redux thunk `login`; thay vào đó gọi:

```ts
signIn("credentials", {
  redirect: false,
  email,
  password,
});
```

Khi thành công:

1. Đóng dialog toàn cục.
2. Điều hướng đến đường dẫn nội bộ đã lưu, nếu không có thì về trang chủ.
3. Refresh router để giao diện render phía server nhận session mới.

Khi thất bại:

- Giữ lại email đã nhập.
- Xóa password trong form.
- Hiển thị lỗi tiếng Việt chung cho thông tin đăng nhập không hợp lệ.
- Không đưa credentials hoặc lỗi xác thực vào URL.

Khu vực hiển thị tài khoản demo phải được ghi rõ chỉ dùng trong development và
không xuất hiện trong production output.

## Luồng đăng xuất

Nút logout ở header và account sidebar gọi `signOut()` của Auth.js mà không
redirect ra địa chỉ ngoài, đóng account menu, chuyển route về `/` và refresh
router.

Logout không còn đọc hoặc vô hiệu hóa Redux refresh token và không xóa
`sessionStorage`; Auth.js tự vô hiệu hóa session cookie của nó.

## Bảo vệ account route và dữ liệu

Next.js 16 dùng `src/proxy.ts` thay cho `middleware.ts`. Proxy matcher chỉ áp
dụng cho `/account` và `/account/:path*`. Khi chưa đăng nhập, navigation được
chuyển về trang chủ cùng một dấu hiệu yêu cầu đăng nhập nội bộ để dialog toàn
cục tự mở.

Proxy chỉ là lớp bảo vệ sớm cho navigation và UX, không phải authorization
boundary cuối cùng. Mọi hàm đọc hoặc ghi dữ liệu riêng tư phải gọi `auth()` gần
thao tác database và từ chối khi không có user id. Code server lấy user id từ
session đã được xác thực, không lấy từ form hoặc query parameter.

Trang account ưu tiên đọc server session và database. Client Component chỉ
nhận dữ liệu profile an toàn cần cho form tương tác.

## Luồng cập nhật profile

Profile form giữ draft state ở local component state. Khi submit, form gọi một
Server Action riêng:

```text
AccountProfileForm
   -> updateProfileAction(input)
   -> Zod kiểm tra displayName, phone, birthDate
   -> auth() lấy user id đáng tin cậy
   -> Prisma cập nhật đúng user đó
   -> revalidate các account path
   -> client session tải lại field đáng tin cậy từ database
```

Quy tắc validation giữ thống nhất với UI hiện tại:

- `displayName` bắt buộc sau khi trim.
- `phone` được để trống hoặc là số Việt Nam gồm 10 chữ số và bắt đầu bằng `0`.
- `birthDate` được để trống hoặc không lớn hơn ngày hiện tại.
- Không cho phép đổi email trong giai đoạn này.

Khi cập nhật JWT sau khi profile thay đổi, server đọc lại các field đáng tin
cậy từ PostgreSQL. Server không được tin role hoặc user id do client gửi lên.

## Chuyển đổi Redux auth

Redux tiếp tục quản lý cart và UI state. Các consumer của auth được chuyển đổi
theo thứ tự:

1. Thêm Auth.js song song với module mock hiện tại.
2. Chuyển `LoginForm` sang Auth.js.
3. Chuyển header và account menu sang đọc/logout bằng Auth.js.
4. Chuyển account guard và truy cập dữ liệu sang server auth.
5. Chuyển lưu profile sang PostgreSQL.
6. Kiểm tra không còn import nào tham chiếu auth mock.
7. Xóa auth mock và gỡ `authReducer` khỏi store.

Chỉ xóa các file sau khi migration đã được kiểm chứng:

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

UI slice tiếp tục quản lý trạng thái mở/đóng login dialog và đường dẫn nội bộ
an toàn sau đăng nhập.

## Xử lý lỗi

Module phân biệt log nội bộ và thông báo công khai:

| Trường hợp | Hành vi công khai |
|---|---|
| Email sai định dạng | Lỗi validation tại field |
| Password thiếu hoặc không hợp lệ | Lỗi validation tại field |
| Email không tồn tại | Thông báo sai thông tin đăng nhập chung |
| Password sai | Thông báo sai thông tin đăng nhập chung |
| Database không khả dụng | Thông báo dịch vụ tạm thời không khả dụng |
| Session thiếu hoặc hết hạn | Về trang chủ và yêu cầu đăng nhập |
| Profile không hợp lệ | Lỗi validation tương ứng từng field |
| Cập nhật profile không có quyền | Từ chối và không ghi database |

Server log không được chứa password, password hash, session cookie,
`DATABASE_URL` hoặc `AUTH_SECRET`.

## Đặc tính bảo mật và giới hạn

- Mật khẩu được hash một chiều bằng bcrypt.
- Auth.js cookie quản lý session thay vì browser storage.
- Credentials được validate ở phía server.
- Private mutation kiểm tra session ngay cạnh thao tác database.
- Không tin user id hoặc role từ input phía client.
- Lỗi đăng nhập không tiết lộ email nào đã đăng ký.
- Environment secret không được commit.
- Code truy cập database không được bundle vào Client Component.

Giai đoạn này có kiến trúc gần production nhưng chưa đủ điều kiện production.
Khi triển khai đăng nhập mật khẩu công khai, hệ thống còn cần rate limiting,
monitoring, secret rotation, chính sách reset password và PostgreSQL được quản
lý kèm backup.

## Dependencies

Runtime dependencies dự kiến:

```text
next-auth
@prisma/client
@prisma/adapter-pg
pg
bcryptjs
zod
```

Development dependencies dự kiến:

```text
prisma
tsx
@types/pg
vitest
```

Khi triển khai phải pin các phiên bản Prisma 7 tương thích và kiểm tra kênh cài
đặt Auth.js hiện tại trước khi cài. Trên Windows, dùng `yarn.cmd` nếu PowerShell
script policy chặn `yarn.ps1`.

## Cấu trúc file đề xuất

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

Giữ nguyên vị trí các component hiện có nếu không cần thay đổi để đáp ứng ranh
giới server/client. Quá trình triển khai không thực hiện refactor thư mục không
liên quan.

## Chiến lược kiểm thử

Vitest cung cấp unit test tập trung cho code phía server. Test phải bao phủ:

- Sign-in schema chấp nhận input đúng và từ chối input sai.
- Hash và verify password thành công với password đúng, thất bại với password
  sai.
- Seed/upsert không công khai field password plaintext.
- Credential authorization trả về safe user fields cho tài khoản hợp lệ.
- Email không tồn tại và password sai cho cùng một kết quả công khai.
- Profile validation kiểm tra đúng display name, phone và birth date.
- Profile mutation không có quyền không thực hiện database update.
- Profile mutation hợp lệ luôn cập nhật user lấy từ session.

Kiểm tra thủ công trên trình duyệt bao gồm:

- Trạng thái thành công và thất bại của login dialog toàn cục.
- Header thay đổi đúng sau login và logout.
- Truy cập trực tiếp từng trang `/account/*` khi chưa đăng nhập.
- Profile mới xuất hiện đồng bộ ở form, sidebar và header.
- Session được khôi phục sau khi reload trình duyệt.
- Cart persistence và collection vẫn hoạt động.

Các lệnh kiểm tra cuối cùng:

```powershell
docker compose ps
yarn.cmd tsc --noEmit
yarn.cmd lint
yarn.cmd test
yarn.cmd build
```

## Thứ tự triển khai

1. Thêm Docker Compose và kiểm tra PostgreSQL health.
2. Cài đặt và cấu hình Prisma 7.
3. Thêm User schema, migration và development seed có hash mật khẩu.
4. Thêm Prisma Client dùng lại, chỉ chạy phía server.
5. Thêm helper kiểm tra password và credentials kèm test.
6. Cấu hình Auth.js Credentials, JWT/session callback và TypeScript type.
7. Thêm Auth.js Route Handler và client session provider.
8. Chuyển login dialog và form sang Auth.js.
9. Chuyển hiển thị session và logout ở header.
10. Thêm account proxy và kiểm tra authorization phía server.
11. Chuyển đọc/cập nhật profile sang PostgreSQL.
12. Xóa Redux auth và module mock sau khi kiểm tra toàn bộ import.
13. Chạy focused test và kiểm tra hồi quy đầy đủ.

## Tiêu chí hoàn thành

- `docker compose up -d` khởi động PostgreSQL service ở trạng thái healthy.
- Prisma migration tạo đúng `User` schema đã duyệt.
- Seed tạo đúng một tài khoản demo có thể đăng nhập và không lưu plaintext
  password.
- Credentials hợp lệ đăng nhập thành công qua dialog hiện tại.
- Credentials không hợp lệ trả lỗi chung và không tạo session.
- Auth.js session tồn tại sau reload mà không cần Redux hoặc
  `sessionStorage` token.
- Header và account UI hiển thị đúng người dùng đã đăng nhập.
- Logout trở về trang chủ và vô hiệu hóa Auth.js session.
- Người chưa đăng nhập không truy cập được dữ liệu hoặc mutation riêng tư.
- Cập nhật profile được lưu trong PostgreSQL và xuất hiện trên toàn account UI.
- Không có auth token hoặc password trong Redux, local storage hay session
  storage.
- Chỉ xóa auth mock cũ khi không còn nơi nào sử dụng.
- Cart, product, collection và global UI không bị regression.
- Typecheck, lint, test và production build đều hoàn thành thành công.
