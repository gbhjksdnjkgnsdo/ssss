/* eslint-env jest */

import cheerio from 'cheerio'
import fsp from 'fs/promises'
import {
  findPort,
  killApp,
  launchApp,
  nextBuild,
  nextStart,
  renderViaHTTP,
} from 'next-test-utils'
import { join } from 'path'

let app
let appPort
const appDir = join(__dirname, '../')

function runTests() {
  it('should render optional catch-all top-level route with no segments', async () => {
    const html = await renderViaHTTP(appPort, '/')
    const $ = cheerio.load(html)
    expect($('#success').text()).toBe('yay')
  })

  it('should render optional catch-all top-level route with one segment', async () => {
    const html = await renderViaHTTP(appPort, '/one')
    const $ = cheerio.load(html)
    expect($('#success').text()).toBe('one')
  })

  it('should render optional catch-all top-level route with two segments', async () => {
    const html = await renderViaHTTP(appPort, '/one/two')
    const $ = cheerio.load(html)
    expect($('#success').text()).toBe('one,two')
  })
}

const nextConfig = join(appDir, 'next.config.js')

describe('Dynamic Optional Routing', () => {
  describe('dev mode', () => {
    beforeAll(async () => {
      appPort = await findPort()
      app = await launchApp(appDir, appPort)
    })
    afterAll(() => killApp(app))

    runTests()
  })
  ;(process.env.TURBOPACK ? describe.skip : describe)('production mode', () => {
    beforeAll(async () => {
      const curConfig = await fsp.readFile(nextConfig, 'utf8')

      if (curConfig.includes('target')) {
        await fsp.writeFile(nextConfig, `module.exports = {}`)
      }
      await nextBuild(appDir)

      appPort = await findPort()
      app = await nextStart(appDir, appPort)
    })
    afterAll(() => killApp(app))

    runTests()
  })
})
