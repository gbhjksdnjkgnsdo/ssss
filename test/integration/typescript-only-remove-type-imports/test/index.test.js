/* eslint-env jest */
/* global jasmine */
import { join } from 'path'
import {
  nextBuild,
  nextStart,
  findPort,
  killApp,
  launchApp,
  renderViaHTTP,
} from 'next-test-utils'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 2

const appDir = join(__dirname, '../')
let app
let appPort

const runTests = () => {
  it('should render a normal page correctly', async () => {
    const html = await renderViaHTTP(appPort, '/normal')
    expect(html).toContain('A normal one')
  })

  it('should render a page with type import correctly', async () => {
    const html = await renderViaHTTP(appPort, '/')
    expect(html).toContain('anton')
    expect(html).toContain('berta')
  })
}

describe('TypeScript onlyRemoveTypeImports', () => {
  describe('production mode', () => {
    beforeAll(async () => {
      const { code } = await nextBuild(appDir)
      if (code !== 0) throw new Error(`build failed with code ${code}`)
      appPort = await findPort()
      app = await nextStart(appDir, appPort)
    })
    afterAll(() => killApp(app))

    runTests()
  })

  describe('dev mode', () => {
    beforeAll(async () => {
      appPort = await findPort()
      app = await launchApp(appDir, appPort)
    })
    afterAll(() => killApp(app))

    runTests()
  })
})
