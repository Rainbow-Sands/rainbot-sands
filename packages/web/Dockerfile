FROM node:24 AS builder

RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/web/package.json ./packages/web/

RUN pnpm install --frozen-lockfile --filter @rainbot/web...

COPY packages/db ./packages/db
COPY packages/web ./packages/web

RUN pnpm --filter @rainbot/web build

FROM node:24-slim AS runner
WORKDIR /app
COPY --from=builder /app/packages/web/build .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "index.js"]
