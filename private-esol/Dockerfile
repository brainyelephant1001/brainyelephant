FROM node:22-bookworm-slim AS course_builder
RUN apt-get -o Acquire::Retries=1 -o Acquire::http::Timeout=30 update && apt-get install -y --no-install-recommends python3 ffmpeg ca-certificates fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
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
COPY --from=course_builder /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf ./private-esol/fonts/DejaVuSans.ttf
COPY --from=course_builder /usr/share/doc/fonts-dejavu-core/copyright ./private-esol/fonts/LICENSE-DejaVu.txt
RUN node --check private-esol/server.js && node --check private-esol/billing.js && node --check private-esol/exams.js && node --check private-esol/customer-test.js && node --check private-esol/results-pdf.js
ENV NODE_ENV=production
USER node
EXPOSE 10000
CMD ["node","private-esol/server.js"]
