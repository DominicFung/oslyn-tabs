import { chromiumLaunchOptions } from './browser'

test('chromium launch flags fit a 1 GB Fargate task', () => {
  expect(chromiumLaunchOptions.headless).toBe(true)
  expect(chromiumLaunchOptions.args).toEqual(expect.arrayContaining([
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ]))
})
