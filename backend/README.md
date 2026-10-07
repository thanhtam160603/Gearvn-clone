<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

## Chat realtime bằng WebSocket thuần

API Gateway nhận WebSocket trên cùng cổng HTTP, đường dẫn `/chat`. Trình duyệt
dùng `new WebSocket('ws://localhost:4000/chat')` ở môi trường local; production
dùng `wss://` sau TLS proxy. Không dùng Socket.IO client cho endpoint này.

Mỗi frame là JSON UTF-8 dạng `{ "event": "...", "data": { ... } }`. Ngay khi
`open`, gửi access token trong vòng 5 giây (không đặt token vào URL):

```ts
const socket = new WebSocket('ws://localhost:4000/chat');
socket.addEventListener('open', () => {
  socket.send(JSON.stringify({ event: 'chat.auth', data: { token: accessToken } }));
});
socket.addEventListener('message', ({ data }) => {
  const frame = JSON.parse(String(data));
  console.log(frame.event, frame.data);
});
```

Sau `chat.auth.ok`, gửi `chat.conversation.join` với
`{ conversationId }`. Chỉ khi nhận `chat.conversation.joined` mới gửi
`chat.message.send` với `{ conversationId, clientMessageId, body }`.
Gateway hỏi Chat Service để kiểm quyền tham gia, và Chat Service kiểm quyền
lại khi lưu. Tin mới đã lưu được phát bằng `chat.message.created`; người gửi
nhận `chat.message.ack`. Nếu chưa nhận ACK, gửi lại cùng `clientMessageId`
**và cùng body** để tránh tạo tin trùng. `chat.error` chứa mã lỗi an toàn.

Khi mất kết nối, đăng nhập và join lại rồi tải lịch sử qua REST để bù các tin
đã bỏ lỡ; ACK không có nghĩa người nhận đã đọc. Room hiện được giữ trong bộ nhớ
của **một** API Gateway instance, chưa hỗ trợ fanout giữa nhiều replica.

Xem [kế hoạch WebSocket thuần](../docs/superpowers/plans/2026-10-01-chat-native-websocket-plan.md)
và [thiết kế giao thức](../docs/superpowers/specs/2026-10-01-chat-native-websocket-design.md).

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Thử API qua Gateway và Swagger

Chạy lệnh từ thư mục `backend/` trong các terminal riêng:

```powershell
yarn.cmd nest start identity-service --watch
yarn.cmd start:gateway:dev
```

Gateway đọc `apps/api-gateway/.env`; cần có `IDENTITY_SERVICE_URL=http://127.0.0.1:4001` như trong `.env.example`. Identity Service cần PostgreSQL và các biến môi trường trong `apps/identity-service/.env`.

Mở `http://127.0.0.1:4000/docs` (`/docs-json` là OpenAPI JSON). Swagger chỉ bật khi `NODE_ENV` không phải `production`. Các đường dẫn bắt đầu bằng `/api`, ví dụ `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/users/me`.

Thử `POST /api/auth/login` để nhận access token, sau đó dùng nút **Authorize** nhập token (không thêm chữ `Bearer`) để gọi `GET /api/users/me`. Refresh token nằm trong cookie HttpOnly do Identity trả qua Gateway; giữ cùng host `127.0.0.1` khi mở Swagger và gọi API để trình duyệt gửi cookie. Swagger UI không cho tự điền `Cookie` header; sau khi login, browser sẽ tự quản lý cookie cho `/api/auth/refresh` và `/api/auth/logout`.

Kiểm tra proxy Gateway: `yarn.cmd test:gateway`.

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project:

```bash
$ yarn install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/overview) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
