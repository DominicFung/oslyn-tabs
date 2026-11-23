/**
 * Fargate's /dev/shm is 64 MB, and Chromium's sandbox fails as root in a container.
 * These flags are also safe on the laptop the worker used to run on.
 */
export const chromiumLaunchOptions = {
  headless: true as const,
  args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
}
