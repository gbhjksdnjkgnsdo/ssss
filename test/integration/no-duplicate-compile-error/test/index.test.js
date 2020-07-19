/* eslint-env jest */
import {
  check,
  File,
  findPort,
  hasRedbox,
  killApp,
  launchApp,
} from 'next-test-utils'
import webdriver from 'next-webdriver'
import { join } from 'path'

jest.setTimeout(1000 * 60 * 3)

const appDir = join(__dirname, '../')

describe('no duplicate compile error output', () => {
  it('show not show compile error on page refresh', async () => {
    let stdout = ''
    let stderr = ''

    const appPort = await findPort()
    const app = await launchApp(appDir, appPort, {
      env: { __NEXT_TEST_WITH_DEVTOOL: true },
      onStdout(msg) {
        stdout += msg || ''
      },
      onStderr(msg) {
        stderr += msg || ''
      },
    })

    const browser = await webdriver(appPort, '/')

    await browser.waitForElementByCss('#a')

    const f = new File(join(appDir, 'pages', 'index.js'))
    f.replace('<div id="a">hello</div>', '<div id="a"!>hello</div>')

    try {
      // Wait for compile error:
      expect(await hasRedbox(browser, true)).toBe(true)

      await browser.refresh()

      // Wait for compile error to re-appear:
      expect(await hasRedbox(browser, true)).toBe(true)
    } finally {
      f.restore()
    }

    // Wait for compile error to disappear:
    await check(
      () => hasRedbox(browser, false).then((r) => (r ? 'yes' : 'no')),
      /no/
    )
    await browser.waitForElementByCss('#a')

    expect((stdout.match(/Unexpected token/g) || []).length).toBe(1)
    expect(stderr).toBe('')

    await killApp(app)
  })
})
