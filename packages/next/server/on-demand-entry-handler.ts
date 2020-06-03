import { EventEmitter } from 'events'
import { IncomingMessage, ServerResponse } from 'http'
import WebpackDevMiddleware from 'next/dist/compiled/webpack-dev-middleware'
import { join, posix } from 'path'
import { stringify } from 'querystring'
import { parse } from 'url'
import webpack from 'webpack'
import DynamicEntryPlugin from 'webpack/lib/DynamicEntryPlugin'
import { isWriteable } from '../build/is-writeable'
import * as Log from '../build/output/log'
import { ClientPagesLoaderOptions } from '../build/webpack/loaders/next-client-pages-loader'
import { API_ROUTE } from '../lib/constants'
import { ROUTE_NAME_REGEX } from '../next-server/lib/constants'
import {
  normalizePagePath,
  denormalizePagePath,
  normalizePathSep,
} from '../next-server/server/normalize-page-path'
import { pageNotFoundError } from '../next-server/server/require'
import { findPageFile } from './lib/find-page-file'

const ADDED = Symbol('added')
const BUILDING = Symbol('building')
const BUILT = Symbol('built')

// Based on https://github.com/webpack/webpack/blob/master/lib/DynamicEntryPlugin.js#L29-L37
function addEntry(
  compilation: webpack.compilation.Compilation,
  context: string,
  name: string,
  entry: string[]
) {
  return new Promise((resolve, reject) => {
    const dep = DynamicEntryPlugin.createDependency(entry, name)
    compilation.addEntry(context, dep, name, (err: Error) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export default function onDemandEntryHandler(
  devMiddleware: WebpackDevMiddleware.WebpackDevMiddleware,
  multiCompiler: webpack.MultiCompiler,
  {
    buildId,
    pagesDir,
    pageExtensions,
    maxInactiveAge,
    pagesBufferLength,
  }: {
    buildId: string
    pagesDir: string
    pageExtensions: string[]
    maxInactiveAge: number
    pagesBufferLength: number
  }
) {
  const { compilers } = multiCompiler
  const invalidator = new Invalidator(devMiddleware, multiCompiler)
  let entries: any = {}
  let lastAccessPages = ['']
  let doneCallbacks: EventEmitter | null = new EventEmitter()

  for (const compiler of compilers) {
    compiler.hooks.make.tapPromise(
      'NextJsOnDemandEntries',
      (compilation: webpack.compilation.Compilation) => {
        invalidator.startBuilding()

        const allEntries = Object.keys(entries).map(async (page) => {
          if (compiler.name === 'client' && page.match(API_ROUTE)) {
            return
          }
          const { name, absolutePagePath } = entries[page]
          const pageExists = await isWriteable(absolutePagePath)
          if (!pageExists) {
            // page was removed
            delete entries[page]
            return
          }

          entries[page].status = BUILDING
          const pageLoaderOpts: ClientPagesLoaderOptions = {
            page,
            absolutePagePath,
          }
          return addEntry(compilation, compiler.context, name, [
            compiler.name === 'client'
              ? `next-client-pages-loader?${stringify(pageLoaderOpts)}!`
              : absolutePagePath,
          ])
        })

        return Promise.all(allEntries).catch((err) => console.error(err))
      }
    )
  }

  function getPagePathsFromEntrypoints(entrypoints: any) {
    const pagePaths = []
    for (const [, entrypoint] of entrypoints.entries()) {
      const result = ROUTE_NAME_REGEX.exec(entrypoint.name)
      if (!result) {
        continue
      }

      const pagePath = result[1]

      if (!pagePath) {
        continue
      }

      pagePaths.push(pagePath)
    }

    return pagePaths
  }

  multiCompiler.hooks.done.tap('NextJsOnDemandEntries', (multiStats) => {
    const [clientStats, serverStats] = multiStats.stats
    const pagePaths = new Set([
      ...getPagePathsFromEntrypoints(clientStats.compilation.entrypoints),
      ...getPagePathsFromEntrypoints(serverStats.compilation.entrypoints),
    ])

    // compilation.entrypoints is a Map object, so iterating over it 0 is the key and 1 is the value
    for (const pagePath of pagePaths) {
      const page = denormalizePagePath(`/${pagePath}`)

      const entry = entries[page]
      if (!entry) {
        continue
      }

      if (entry.status !== BUILDING) {
        continue
      }

      entry.status = BUILT
      entry.lastActiveTime = Date.now()
      doneCallbacks!.emit(page)
    }

    invalidator.doneBuilding()
  })

  const disposeHandler = setInterval(function () {
    disposeInactiveEntries(
      devMiddleware,
      entries,
      lastAccessPages,
      maxInactiveAge
    )
  }, 5000)

  disposeHandler.unref()

  function handlePing(pg: string) {
    const page = normalizePathSep(pg)
    const entryInfo = entries[page]
    let toSend

    // If there's no entry, it may have been invalidated and needs to be re-built.
    if (!entryInfo) {
      // if (page !== lastEntry) client pings, but there's no entry for page
      return { invalid: true }
    }

    // 404 is an on demand entry but when a new page is added we have to refresh the page
    if (page === '/_error') {
      toSend = { invalid: true }
    } else {
      toSend = { success: true }
    }

    // We don't need to maintain active state of anything other than BUILT entries
    if (entryInfo.status !== BUILT) return

    // If there's an entryInfo
    if (!lastAccessPages.includes(page)) {
      lastAccessPages.unshift(page)

      // Maintain the buffer max length
      if (lastAccessPages.length > pagesBufferLength) {
        lastAccessPages.pop()
      }
    }
    entryInfo.lastActiveTime = Date.now()
    return toSend
  }

  return {
    async ensurePage(page: string) {
      let normalizedPagePath: string
      try {
        normalizedPagePath = normalizePagePath(page)
      } catch (err) {
        console.error(err)
        throw pageNotFoundError(page)
      }

      let pagePath = await findPageFile(
        pagesDir,
        normalizedPagePath,
        pageExtensions
      )

      // Default the /_error route to the Next.js provided default page
      if (page === '/_error' && pagePath === null) {
        pagePath = 'next/dist/pages/_error'
      }

      if (pagePath === null) {
        throw pageNotFoundError(normalizedPagePath)
      }

      let pageUrl = pagePath.replace(/\\/g, '/')

      pageUrl = `${pageUrl[0] !== '/' ? '/' : ''}${pageUrl
        .replace(new RegExp(`\\.+(?:${pageExtensions.join('|')})$`), '')
        .replace(/\/index$/, '')}`

      pageUrl = pageUrl === '' ? '/' : pageUrl

      const bundleFile = `${normalizePagePath(pageUrl)}.js`
      const name = join('static', buildId, 'pages', bundleFile)
      const absolutePagePath = pagePath.startsWith('next/dist/pages')
        ? require.resolve(pagePath)
        : join(pagesDir, pagePath)

      page = posix.normalize(pageUrl)

      return new Promise((resolve, reject) => {
        // Makes sure the page that is being kept in on-demand-entries matches the webpack output
        const normalizedPage = normalizePathSep(page)
        const entryInfo = entries[normalizedPage]

        if (entryInfo) {
          if (entryInfo.status === BUILT) {
            resolve()
            return
          }

          if (entryInfo.status === BUILDING) {
            doneCallbacks!.once(normalizedPage, handleCallback)
            return
          }
        }

        Log.event(`build page: ${normalizedPage}`)

        entries[normalizedPage] = { name, absolutePagePath, status: ADDED }
        doneCallbacks!.once(normalizedPage, handleCallback)

        invalidator.invalidate()

        function handleCallback(err: Error) {
          if (err) return reject(err)
          resolve()
        }
      })
    },

    middleware() {
      return (req: IncomingMessage, res: ServerResponse, next: Function) => {
        if (!/^\/_next\/webpack-hmr/.test(req.url!)) return next()

        const { query } = parse(req.url!, true)
        const page = query.page
        if (!page) return next()

        const runPing = () => {
          const data = handlePing(query.page as string)
          if (!data) return
          res.write('data: ' + JSON.stringify(data) + '\n\n')
        }
        const pingInterval = setInterval(() => runPing(), 5000)

        req.on('close', () => {
          clearInterval(pingInterval)
        })
        next()
      }
    },
  }
}

function disposeInactiveEntries(
  devMiddleware: WebpackDevMiddleware.WebpackDevMiddleware,
  entries: any,
  lastAccessPages: any,
  maxInactiveAge: number
) {
  const disposingPages: any = []

  Object.keys(entries).forEach((page) => {
    const { lastActiveTime, status } = entries[page]

    // This means this entry is currently building or just added
    // We don't need to dispose those entries.
    if (status !== BUILT) return

    // We should not build the last accessed page even we didn't get any pings
    // Sometimes, it's possible our XHR ping to wait before completing other requests.
    // In that case, we should not dispose the current viewing page
    if (lastAccessPages.includes(page)) return

    if (Date.now() - lastActiveTime > maxInactiveAge) {
      disposingPages.push(page)
    }
  })

  if (disposingPages.length > 0) {
    disposingPages.forEach((page: any) => {
      delete entries[page]
    })
    // disposing inactive page(s)
    devMiddleware.invalidate()
  }
}

// Make sure only one invalidation happens at a time
// Otherwise, webpack hash gets changed and it'll force the client to reload.
class Invalidator {
  private multiCompiler: webpack.MultiCompiler
  private devMiddleware: WebpackDevMiddleware.WebpackDevMiddleware
  private building: boolean
  private rebuildAgain: boolean

  constructor(
    devMiddleware: WebpackDevMiddleware.WebpackDevMiddleware,
    multiCompiler: webpack.MultiCompiler
  ) {
    this.multiCompiler = multiCompiler
    this.devMiddleware = devMiddleware
    // contains an array of types of compilers currently building
    this.building = false
    this.rebuildAgain = false
  }

  invalidate() {
    // If there's a current build is processing, we won't abort it by invalidating.
    // (If aborted, it'll cause a client side hard reload)
    // But let it to invalidate just after the completion.
    // So, it can re-build the queued pages at once.
    if (this.building) {
      this.rebuildAgain = true
      return
    }

    this.building = true
    // Work around a bug in webpack, calling `invalidate` on Watching.js
    // doesn't trigger the invalid call used to keep track of the `.done` hook on multiCompiler
    for (const compiler of this.multiCompiler.compilers) {
      compiler.hooks.invalid.call()
    }
    this.devMiddleware.invalidate()
  }

  startBuilding() {
    this.building = true
  }

  doneBuilding() {
    this.building = false

    if (this.rebuildAgain) {
      this.rebuildAgain = false
      this.invalidate()
    }
  }
}
