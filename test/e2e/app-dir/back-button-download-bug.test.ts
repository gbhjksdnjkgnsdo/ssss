import { createNext, FileRef } from 'e2e-utils'
import { NextInstance } from 'test/lib/next-modes/base'
import path from 'path'
import webdriver from 'next-webdriver'

describe('app-dir back button download bug', () => {
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: new FileRef(path.join(__dirname, 'back-button-download-bug')),
      dependencies: {
        react: 'experimental',
        'react-dom': 'experimental',
      },
      skipStart: true,
    })

    await next.start()
  })
  afterAll(() => next.destroy())

  it('should redirect route when clicking link', async () => {
    const browser = await webdriver(next.url, '/')
    const text = await browser
      .elementByCss('#to-post-1')
      .click()
      .waitForElementByCss('#post-page')
      .text()
    expect(text).toBe('This is the post page')

    await browser.back()

    expect(await browser.waitForElementByCss('#home-page').text()).toBe('Home!')
  })
})
