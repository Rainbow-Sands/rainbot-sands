FROM node:24

RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/

RUN pnpm install --frozen-lockfile --filter @rainbot/db

COPY packages/db ./packages/db

CMD ["pnpm", "--filter", "@rainbot/db", "db:migrate"]
