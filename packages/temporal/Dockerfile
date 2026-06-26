FROM node:24

RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/temporal/package.json ./packages/temporal/

RUN pnpm install --frozen-lockfile --filter @rainbot/temporal...

COPY packages/db ./packages/db
COPY packages/temporal ./packages/temporal

ENTRYPOINT ["node", "packages/temporal/src/worker.ts"]
