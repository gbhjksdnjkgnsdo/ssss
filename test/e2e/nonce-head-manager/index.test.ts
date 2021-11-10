import { createNext, FileRef } from 'e2e-utils'
import { check, waitFor } from 'next-test-utils'
import webdriver from 'next-webdriver'
import { NextInstance } from 'test/lib/next-modes/base'
import { join } from 'path'

describe('should set-up next', () => {
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: {
        pages: new FileRef(join(__dirname, 'app/pages')),
        public: new FileRef(join(__dirname, 'app/public')),
      },
      nextConfig: new FileRef(join(__dirname, 'app/next.config.js')),
    })
  })
  afterAll(() => next.destroy())

  async function runTests(url) {
    const browser = await webdriver(next.url, url)
    await check(
      async () =>
        await browser.eval(`JSON.stringify(window.scriptExecutionIds)`),
      '["src-1.js"]'
    )

    await browser.elementByCss('#force-rerender').click()
    await check(
      async () =>
        await browser.eval(`document.getElementById('h1').textContent`),
      'Count 1'
    )
    await check(
      async () =>
        await browser.eval(`JSON.stringify(window.scriptExecutionIds)`),
      '["src-1.js"]'
    )

    await browser.elementByCss('#change-script').click()
    await check(
      async () =>
        await browser.eval(`JSON.stringify(window.scriptExecutionIds)`),
      '["src-1.js","src-2.js"]'
    )
  }

  it('Re-rendering should not re-execute the script', async () => {
    await runTests('/')
  })

  it('Re-rendering should not re-execute the script with CSP header', async () => {
    await runTests('/csp')
  })
})
