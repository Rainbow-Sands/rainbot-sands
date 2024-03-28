FROM oven/bun:1

COPY package.json ./
COPY bun.lockb ./
COPY src ./

USER bun
RUN bun install --production
ENTRYPOINT [ "bun", "run", "index.ts" ]