/* eslint-env jest */
/* global jasmine */
import fs from 'fs-extra'
import { join } from 'path'
import {
  renderViaHTTP,
  findPort,
  nextBuild,
  nextStart,
  killApp,
  launchApp,
} from 'next-test-utils'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 2
const appDir = join(__dirname, '..')
const nextConfig = join(appDir, 'next.config.js')
let appPort
let app

const runTests = isDev => {
  it('renders custom _error successfully', async () => {
    const html = await renderViaHTTP(appPort, '/')
    expect(html).toMatch(isDev ? /oof/ : /Custom error/)
  })

  it('renders 404 page when ENOENT error is thrown', async () => {
    const html = await renderViaHTTP(appPort, '/throw-404')
    expect(html).toContain('Custom error')
    expect(html).not.toContain('to 404 we go')
  })
}

const customErrNo404Match = /You have added a custom \/_error page without a custom \/404 page/

describe('Custom _error', () => {
  describe('dev mode', () => {
    let stderr = ''

    beforeAll(async () => {
      appPort = await findPort()
      app = await launchApp(appDir, appPort, {
        onStderr(msg) {
          stderr += msg || ''
        },
      })
    })
    afterAll(() => killApp())

    it('should not warn with /_error and /404', async () => {
      stderr = ''
      const page404 = join(appDir, 'pages/404.js')
      await fs.writeFile(page404, `export default () => 'not found...'`)
      const html = await renderViaHTTP(appPort, '/404')
      await fs.remove(page404)
      expect(html).toContain('not found...')
      expect(stderr).not.toMatch(customErrNo404Match)
    })

    it('should warn on custom /_error without custom /404', async () => {
      stderr = ''
      const html = await renderViaHTTP(appPort, '/404')
      expect(html).toContain('An error 404 occurred on server')
      expect(stderr).toMatch(customErrNo404Match)
    })

    runTests(true)
  })

  describe('production mode', () => {
    let buildOutput = ''

    beforeAll(async () => {
      const { stdout, stderr } = await nextBuild(appDir, undefined, {
        stdout: true,
        stderr: true,
      })
      buildOutput = (stdout || '') + (stderr || '')
      appPort = await findPort()
      app = await nextStart(appDir, appPort)
    })
    afterAll(() => killApp(app))

    it('should not contain /_error in build output', async () => {
      expect(buildOutput).toMatch(/λ .*?\/404/)
      expect(buildOutput).not.toMatch(/λ .*?\/_error/)
    })

    runTests()
  })

  describe('serverless mode', () => {
    beforeAll(async () => {
      await fs.writeFile(
        nextConfig,
        `module.exports = { target: 'serverless' }`
      )
      await nextBuild(appDir)
      appPort = await findPort()
      app = await nextStart(appDir, appPort)
    })
    afterAll(async () => {
      await killApp(app)
      await fs.remove(nextConfig)
    })

    runTests()
  })
})
