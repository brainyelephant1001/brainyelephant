FROM node:22-bookworm-slim AS course_builder
RUN apt-get -o Acquire::Retries=1 -o Acquire::http::Timeout=30 update && apt-get install -y --no-install-recommends python3 ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY esol ./esol
COPY tools/esol ./tools/esol
RUN python3 tools/esol/build_audio.py

FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=course_builder /app/node_modules ./node_modules
COPY --from=course_builder /app/esol ./esol
COPY package.json package-lock.json ./
COPY private-esol ./private-esol
RUN node --check private-esol/server.js && node --check private-esol/billing.js
ENV NODE_ENV=production
USER node
EXPOSE 10000
CMD ["node","private-esol/server.js"]
