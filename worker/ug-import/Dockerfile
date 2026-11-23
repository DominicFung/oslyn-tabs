FROM node:22-bookworm-slim

WORKDIR /app

# Playwright's postinstall would download Chromium before its system libraries exist.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN npm ci \
  && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0 npx playwright install --with-deps chromium \
  && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

COPY tsconfig.json jest.config.js ./
COPY src ./src
COPY start-worker.sh ./
RUN chmod +x start-worker.sh

# PID 1 is the existing supervisor: it restarts a stale heartbeat, and SIGTERM
# lets the current import finish or return to pending. ECS restarts the task
# if this process exits. Runs as root so Chromium's container sandbox flags work.
CMD ["./start-worker.sh"]
