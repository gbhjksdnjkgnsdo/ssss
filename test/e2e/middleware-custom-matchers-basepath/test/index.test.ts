/* eslint-env jest */

import { join } from 'path'
import webdriver from 'next-webdriver'
import { fetchViaHTTP } from 'next-test-utils'
import { createNext, FileRef } from 'e2e-utils'
import { NextInstance } from 'test/lib/next-modes/base'

describe('Middleware custom matchers basePath', () => {
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: new FileRef(join(__dirname, '../app')),
    })
  })
  afterAll(() => next.destroy())

  it.each(['/docs/hello', '/docs/about'])('should match', async (path) => {
    const res = await fetchViaHTTP(next.url, path)
    expect(res.status).toBe(200)
    expect(res.headers.get('x-from-middleware')).toBeDefined()
  })

  it.each(['/hello', '/about', '/invalid/docs/hello'])(
    'should not match',
    async (path) => {
      const res = await fetchViaHTTP(next.url, path)
      expect(res.status).toBe(404)
    }
  )

  it.each(['hello', 'about'])(
    'should match has query on client routing',
    async (id) => {
      const browser = await webdriver(next.url, '/docs/routes')
      await browser.eval('window.__TEST_NO_RELOAD = true')
      await browser.elementById(id).click()
      const fromMiddleware = await browser.elementById('from-middleware').text()
      expect(fromMiddleware).toBe('true')
      const noReload = await browser.eval('window.__TEST_NO_RELOAD')
      expect(noReload).toBe(true)
    }
  )
})
