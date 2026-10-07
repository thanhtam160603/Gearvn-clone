FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn install --immutable

COPY . .

# Prisma 7 reads a datasource URL while generating, but does not connect to it.
RUN set -eu; \
    export IDENTITY_DATABASE_URL=postgresql://build:build@localhost:5432/identity_db; \
    export CATALOG_DATABASE_URL=postgresql://build:build@localhost:5432/catalog_db; \
    export CART_DATABASE_URL=postgresql://build:build@localhost:5432/cart_db; \
    export ORDER_DATABASE_URL=postgresql://build:build@localhost:5432/order_db; \
    export CHAT_DATABASE_URL=postgresql://build:build@localhost:5432/chat_db; \
    for service in identity catalog cart order chat; do \
      yarn prisma generate --config "apps/${service}-service/prisma.config.ts"; \
    done; \
    yarn build:all

ENV NODE_ENV=production
CMD ["node", "dist/apps/api-gateway/main.js"]
