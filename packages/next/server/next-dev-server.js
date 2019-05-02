import Server from 'next-server/dist/server/next-server'
import { join, extname } from 'path'
import HotReloader from './hot-reloader'
import { route } from 'next-server/dist/server/router'
import { PHASE_DEVELOPMENT_SERVER } from 'next-server/constants'
import ErrorDebug from './error-debug'
import AmpHtmlValidator from 'amphtml-validator'
import { ampValidation } from '../build/output/index'
import * as Log from '../build/output/log'
import { recursiveReadDir } from '../lib/recursive-readdir'
import fs from 'fs'

const React = require('react')

if (typeof React.Suspense === 'undefined') {
  throw new Error(`The version of React you are using is lower than the minimum required version needed for Next.js. Please upgrade "react" and "react-dom": "npm install --save react react-dom" https://err.sh/zeit/next.js/invalid-react-version`)
}

const getRouteNoExt = (curRoute) => {
  const ext = extname(curRoute)
  if (ext) curRoute = curRoute.replace(ext, '')
  return curRoute
}

export default class DevServer extends Server {
  constructor (options) {
    super(options, true)
    this.initialRoutes = [...this.router.routes]
    this.renderOpts.ErrorDebug = ErrorDebug
    this.devReady = new Promise(resolve => {
      this.setDevReady = resolve
    })
    this.renderOpts.ampValidator = (html, pathname) => {
      return AmpHtmlValidator.getInstance().then(validator => {
        const result = validator.validateString(html)
        ampValidation(
          pathname,
          result.errors
            .filter(e => e.severity === 'ERROR')
            .filter(e => this._filterAmpDevelopmentScript(html, e)),
          result.errors.filter(e => e.severity !== 'ERROR')
        )
      })
    }
  }

  currentPhase () {
    return PHASE_DEVELOPMENT_SERVER
  }

  readBuildId () {
    return 'development'
  }

  async addExportPathMapRoutes () {
    // Makes `next export` exportPathMap work in development mode.
    // So that the user doesn't have to define a custom server reading the exportPathMap
    if (this.nextConfig.exportPathMap) {
      console.log('Defining routes from exportPathMap')
      const exportPathMap = await this.nextConfig.exportPathMap({}, { dev: true, dir: this.dir, outDir: null, distDir: this.distDir, buildId: this.buildId }) // In development we can't give a default path mapping
      for (const path in exportPathMap) {
        const { page, query = {} } = exportPathMap[path]
        // We use unshift so that we're sure the routes is defined before Next's default routes
        this.router.add({
          match: route(path),
          fn: async (req, res, params, parsedUrl) => {
            const { query: urlQuery } = parsedUrl

            Object.keys(urlQuery)
              .filter(key => query[key] === undefined)
              .forEach(key => console.warn(`Url defines a query parameter '${key}' that is missing in exportPathMap`))

            const mergedQuery = { ...urlQuery, ...query }

            await this.render(req, res, page, mergedQuery, parsedUrl)
          }
        })
      }
    }
  }

  async updateRoutes () {
    // use Set to filter duplicates from '{page}/index' and {page}
    const pages = new Set(
      (await recursiveReadDir(
        join(this.dir, 'pages'), /.*/, true
      ))
        .map(pg =>
          getRouteNoExt(pg)
            .replace(/\\/g, '/')
            .replace(/\/index$/, '')
        )
    )

    pages.delete('') // remove '/index' -> ''
    this.router.routes = this.generateDynamicRoutes(
      Array.from(pages), this.initialRoutes
    )
    await this.addExportPathMapRoutes()
  }

  async prepare () {
    this.hotReloader = new HotReloader(this.dir, { config: this.nextConfig, buildId: this.buildId })
    await super.prepare()
    await this.addExportPathMapRoutes()
    await this.hotReloader.start()

    // watch for dynamic routes changing
    fs.watch(join(this.dir, 'pages'), { recursive: true },
      (evt, filename) => {
        if (filename.includes('$')) this.updateRoutes()
      }
    )
    await this.updateRoutes()
    this.setDevReady()
  }

  async close () {
    if (this.hotReloader) {
      await this.hotReloader.stop()
    }
  }

  async run (req, res, parsedUrl) {
    await this.devReady
    const { finished } = await this.hotReloader.run(req, res, parsedUrl)
    if (finished) {
      return
    }

    return super.run(req, res, parsedUrl)
  }

  generateRoutes (initial) {
    const routes = super.generateRoutes(initial)

    // In development we expose all compiled files for react-error-overlay's line show feature
    // We use unshift so that we're sure the routes is defined before Next's default routes
    routes.unshift({
      match: route('/_next/development/:path*'),
      fn: async (req, res, params) => {
        const p = join(this.distDir, ...(params.path || []))
        await this.serveStatic(req, res, p)
      }
    })

    return routes
  }

  _filterAmpDevelopmentScript (html, event) {
    if (event.code !== 'DISALLOWED_SCRIPT_TAG') {
      return true
    }

    const snippetChunks = html.split('\n')

    let snippet
    if (
      !(snippet = html.split('\n')[event.line - 1]) ||
      !(snippet = snippet.substring(event.col))
    ) {
      return true
    }

    snippet = snippet + snippetChunks.slice(event.line).join('\n')
    snippet = snippet.substring(0, snippet.indexOf('</script>'))

    return !snippet.includes('data-amp-development-mode-only')
  }

  async renderToHTML (req, res, pathname, query, options = {}) {
    const compilationErr = await this.getCompilationError(pathname)
    if (compilationErr) {
      res.statusCode = 500
      return this.renderErrorToHTML(compilationErr, req, res, pathname, query)
    }

    // In dev mode we use on demand entries to compile the page before rendering
    try {
      await this.hotReloader.ensurePage(pathname)
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404
        return this.renderErrorToHTML(null, req, res, pathname, query)
      }
      if (!this.quiet) console.error(err)
    }
    const html = await super.renderToHTML(req, res, pathname, query, options)
    return html
  }

  async renderErrorToHTML (err, req, res, pathname, query) {
    await this.hotReloader.ensurePage('/_error')

    const compilationErr = await this.getCompilationError(pathname)
    if (compilationErr) {
      res.statusCode = 500
      return super.renderErrorToHTML(compilationErr, req, res, pathname, query)
    }

    if (!err && res.statusCode === 500) {
      err = new Error(
        'An undefined error was thrown sometime during render... ' +
          'See https://err.sh/zeit/next.js/threw-undefined'
      )
    }

    try {
      const out = await super.renderErrorToHTML(err, req, res, pathname, query)
      return out
    } catch (err2) {
      if (!this.quiet) Log.error(err2)
      res.statusCode = 500
      return super.renderErrorToHTML(err2, req, res, pathname, query)
    }
  }

  sendHTML (req, res, html) {
    // In dev, we should not cache pages for any reason.
    res.setHeader('Cache-Control', 'no-store, must-revalidate')
    return super.sendHTML(req, res, html)
  }

  setImmutableAssetCacheControl (res) {
    res.setHeader('Cache-Control', 'no-store, must-revalidate')
  }

  async getCompilationError (page) {
    const errors = await this.hotReloader.getCompilationErrors(page)
    if (errors.length === 0) return

    // Return the very first error we found.
    return errors[0]
  }
}
