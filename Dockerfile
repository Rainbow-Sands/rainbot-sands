FROM oven/bun:latest

RUN apt-get update && apt-get install -y ffmpeg

COPY package.json ./
COPY bun.lockb ./
COPY src ./

RUN bun install --production
ENTRYPOINT [ "bun", "run", "index.ts" ]
