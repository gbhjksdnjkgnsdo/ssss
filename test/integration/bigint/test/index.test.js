/* eslint-env jest */

import fsp from 'fs/promises'
import { join } from 'path'
import {
  fetchViaHTTP,
  launchApp,
  nextBuild,
  nextStart,
  killApp,
  findPort,
} from 'next-test-utils'

const appDir = join(__dirname, '..')
const nextConfig = join(appDir, 'next.config.js')
let appPort
let app

const runTests = () => {
  it('should return 200', async () => {
    const res = await fetchViaHTTP(appPort, '/api/bigint', null, {
      method: 'GET',
    })
    expect(res.status).toEqual(200)
  })

  it('should return the BigInt result text', async () => {
    const resText = await fetchViaHTTP(appPort, '/api/bigint', null, {
      method: 'GET',
    }).then((res) => res.ok && res.text())
    expect(resText).toEqual('3')
  })
}

describe('bigint API route support', () => {
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
      await fsp.rm(nextConfig, { recursive: true, force: true })
      await nextBuild(appDir)
      appPort = await findPort()
      app = await nextStart(appDir, appPort)
    })
    afterAll(() => killApp(app))

    runTests()
  })
})
