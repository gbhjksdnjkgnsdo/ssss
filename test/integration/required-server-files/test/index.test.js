/* eslint-env jest */

import http from 'http'
import fs from 'fs-extra'
import { join } from 'path'
import cheerio from 'cheerio'
import Server from 'next/dist/next-server/server/next-server'
import { findPort, nextBuild, renderViaHTTP } from 'next-test-utils'

jest.setTimeout(1000 * 60 * 2)

const appDir = join(__dirname, '..')
let server
let nextApp
let appPort
let buildId
let requiredFilesManifest

describe('Required Server Files', () => {
  beforeAll(async () => {
    await fs.remove(join(appDir, '.next'))
    await nextBuild(appDir)

    buildId = await fs.readFile(join(appDir, '.next/BUILD_ID'), 'utf8')
    requiredFilesManifest = await fs.readJSON(
      join(appDir, '.next/required-server-files.json')
    )

    let files = await fs.readdir(join(appDir, '.next'))

    for (const file of files) {
      if (
        file === 'server' ||
        file === 'required-server-files.json' ||
        requiredFilesManifest.files.includes(join('.next', file))
      ) {
        continue
      }
      console.log('removing', join('.next', file))
      await fs.remove(join(appDir, '.next', file))
    }
    await fs.rename(join(appDir, 'pages'), join(appDir, 'pages-bak'))

    nextApp = new Server({
      conf: {},
      dir: appDir,
      quiet: false,
      minimalMode: true,
    })
    appPort = await findPort()

    server = http.createServer(async (req, res) => {
      try {
        await nextApp.getRequestHandler()(req, res)
      } catch (err) {
        console.error(err)
        res.statusCode = 500
        res.end('error')
      }
    })
    await new Promise((res, rej) => {
      server.listen(appPort, (err) => (err ? rej(err) : res()))
    })
    console.log(`Listening at ::${appPort}`)
  })
  afterAll(async () => {
    if (server) server.close()
    await fs.rename(join(appDir, 'pages-bak'), join(appDir, 'pages'))
  })

  it('should output required-server-files manifest correctly', async () => {
    expect(requiredFilesManifest.version).toBe(1)
    expect(Array.isArray(requiredFilesManifest.files)).toBe(true)
    expect(Array.isArray(requiredFilesManifest.ignore)).toBe(true)
    expect(requiredFilesManifest.files.length).toBeGreaterThan(0)
    expect(requiredFilesManifest.ignore.length).toBeGreaterThan(0)
    expect(typeof requiredFilesManifest.config.trailingSlash).toBe('boolean')
  })

  it('should render SSR page correctly', async () => {
    const html = await renderViaHTTP(appPort, '/')
    const $ = cheerio.load(html)
    const data = JSON.parse($('#props').text())

    expect($('#index').text()).toBe('index page')
    expect(data.hello).toBe('world')

    const html2 = await renderViaHTTP(appPort, '/')
    const $2 = cheerio.load(html2)
    const data2 = JSON.parse($2('#props').text())

    expect($2('#index').text()).toBe('index page')
    expect(isNaN(data2.random)).toBe(false)
    expect(data2.random).not.toBe(data.random)
  })

  it('should render dynamic SSR page correctly', async () => {
    const html = await renderViaHTTP(appPort, '/dynamic/first')
    const $ = cheerio.load(html)
    const data = JSON.parse($('#props').text())

    expect($('#dynamic').text()).toBe('dynamic page')
    expect($('#slug').text()).toBe('first')
    expect(data.hello).toBe('world')

    const html2 = await renderViaHTTP(appPort, '/dynamic/second')
    const $2 = cheerio.load(html2)
    const data2 = JSON.parse($2('#props').text())

    expect($2('#dynamic').text()).toBe('dynamic page')
    expect($2('#slug').text()).toBe('second')
    expect(isNaN(data2.random)).toBe(false)
    expect(data2.random).not.toBe(data.random)
  })

  it('should render fallback page correctly', async () => {
    const html = await renderViaHTTP(appPort, '/fallback/first')
    const $ = cheerio.load(html)
    const data = JSON.parse($('#props').text())

    expect($('#fallback').text()).toBe('fallback page')
    expect($('#slug').text()).toBe('first')
    expect(data.hello).toBe('world')

    const html2 = await renderViaHTTP(appPort, '/fallback/first')
    const $2 = cheerio.load(html2)
    const data2 = JSON.parse($2('#props').text())

    expect($2('#fallback').text()).toBe('fallback page')
    expect($2('#slug').text()).toBe('first')
    expect(isNaN(data2.random)).toBe(false)
    expect(data2.random).not.toBe(data.random)

    const html3 = await renderViaHTTP(appPort, '/fallback/second')
    const $3 = cheerio.load(html3)
    const data3 = JSON.parse($3('#props').text())

    expect($3('#fallback').text()).toBe('fallback page')
    expect($3('#slug').text()).toBe('second')
    expect(isNaN(data3.random)).toBe(false)

    const { pageProps: data4 } = JSON.parse(
      await renderViaHTTP(appPort, `/_next/data/${buildId}/fallback/third.json`)
    )
    expect(data4.hello).toBe('world')
    expect(data4.slug).toBe('third')
  })

  it('should render SSR page correctly with x-matched-path', async () => {
    const html = await renderViaHTTP(appPort, '/some-other-path', undefined, {
      headers: {
        'x-matched-path': '/',
      },
    })
    const $ = cheerio.load(html)
    const data = JSON.parse($('#props').text())

    expect($('#index').text()).toBe('index page')
    expect(data.hello).toBe('world')

    const html2 = await renderViaHTTP(appPort, '/some-other-path', undefined, {
      headers: {
        'x-matched-path': '/',
      },
    })
    const $2 = cheerio.load(html2)
    const data2 = JSON.parse($2('#props').text())

    expect($2('#index').text()).toBe('index page')
    expect(isNaN(data2.random)).toBe(false)
    expect(data2.random).not.toBe(data.random)
  })

  it('should render dynamic SSR page correctly with x-matched-path', async () => {
    const html = await renderViaHTTP(appPort, '/some-other-path', undefined, {
      headers: {
        'x-matched-path': '/dynamic/[slug]?slug=first',
      },
    })
    const $ = cheerio.load(html)
    const data = JSON.parse($('#props').text())

    expect($('#dynamic').text()).toBe('dynamic page')
    expect($('#slug').text()).toBe('first')
    expect(data.hello).toBe('world')

    const html2 = await renderViaHTTP(appPort, '/some-other-path', undefined, {
      headers: {
        'x-matched-path': '/dynamic/[slug]?slug=second',
      },
    })
    const $2 = cheerio.load(html2)
    const data2 = JSON.parse($2('#props').text())

    expect($2('#dynamic').text()).toBe('dynamic page')
    expect($2('#slug').text()).toBe('second')
    expect(isNaN(data2.random)).toBe(false)
    expect(data2.random).not.toBe(data.random)
  })

  it('should render dynamic SSR page correctly with x-matched-path and routes-matches', async () => {
    const html = await renderViaHTTP(appPort, '/dynamic/[slug]', undefined, {
      headers: {
        'x-matched-path': '/dynamic/[slug]',
        'x-now-route-matches': '1=first',
      },
    })
    const $ = cheerio.load(html)
    const data = JSON.parse($('#props').text())

    expect($('#dynamic').text()).toBe('dynamic page')
    expect($('#slug').text()).toBe('first')
    expect(data.hello).toBe('world')

    const html2 = await renderViaHTTP(appPort, '/dynamic/[slug]', undefined, {
      headers: {
        'x-matched-path': '/dynamic/[slug]',
        'x-now-route-matches': '1=second',
      },
    })
    const $2 = cheerio.load(html2)
    const data2 = JSON.parse($2('#props').text())

    expect($2('#dynamic').text()).toBe('dynamic page')
    expect($2('#slug').text()).toBe('second')
    expect(isNaN(data2.random)).toBe(false)
    expect(data2.random).not.toBe(data.random)
  })
})
