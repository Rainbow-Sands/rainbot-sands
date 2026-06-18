FROM node:20

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY tsconfig.json ./
COPY src ./src

ENTRYPOINT ["node", "src/index.ts"]
