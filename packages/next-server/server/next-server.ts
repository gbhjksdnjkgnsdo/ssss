/* eslint-disable import/first */
import { IncomingMessage, ServerResponse } from 'http'
import { resolve, join, sep, extname } from 'path'
import { parse as parseUrl, UrlWithParsedQuery } from 'url'
import { parse as parseQs, ParsedUrlQuery } from 'querystring'
import fs from 'fs'
import { renderToHTML } from './render'
import { sendHTML } from './send-html'
import { serveStatic } from './serve-static'
import Router, { route, Route } from './router'
import { isInternalUrl, isBlockedPage } from './utils'
import loadConfig from './config'
import {
  PHASE_PRODUCTION_SERVER,
  BUILD_ID_FILE,
  CLIENT_STATIC_FILES_PATH,
  CLIENT_STATIC_FILES_RUNTIME,
} from '../lib/constants'
import * as envConfig from '../lib/runtime-config'
import { loadComponents } from './load-components'
import { recursiveReadDir } from 'next/dist/lib/recursive-readdir'

const getRouteNoExt = (curRoute: string): string => {
  const ext = extname(curRoute)
  if (ext) curRoute = curRoute.replace(ext, '')
  return curRoute
}

type NextConfig = any

export type ServerConstructor = {
  dir?: string
  staticMarkup?: boolean
  quiet?: boolean
  conf?: NextConfig,
}

export default class Server {
  dir: string
  quiet: boolean
  nextConfig: NextConfig
  distDir: string
  buildId: string
  renderOpts: {
    poweredByHeader: boolean
    ampBindInitData: boolean
    staticMarkup: boolean
    buildId: string
    generateEtags: boolean
    runtimeConfig?: { [key: string]: any }
    assetPrefix?: string,
  }
  routesPromise?: Promise<void>
  router: Router

  public constructor({
    dir = '.',
    staticMarkup = false,
    quiet = false,
    conf = null,
  }: ServerConstructor = {}) {
    this.dir = resolve(dir)
    this.quiet = quiet
    const phase = this.currentPhase()
    this.nextConfig = loadConfig(phase, this.dir, conf)
    this.distDir = join(this.dir, this.nextConfig.distDir)

    // Only serverRuntimeConfig needs the default
    // publicRuntimeConfig gets it's default in client/index.js
    const {
      serverRuntimeConfig = {},
      publicRuntimeConfig,
      assetPrefix,
      generateEtags,
      target,
    } = this.nextConfig

    if (process.env.NODE_ENV === 'production' && target !== 'server')
      throw new Error(
        'Cannot start server when target is not server. https://err.sh/zeit/next.js/next-start-serverless',
      )

    this.buildId = this.readBuildId()
    this.renderOpts = {
      ampBindInitData: this.nextConfig.experimental.ampBindInitData,
      poweredByHeader: this.nextConfig.poweredByHeader,
      staticMarkup,
      buildId: this.buildId,
      generateEtags,
    }

    // Only the `publicRuntimeConfig` key is exposed to the client side
    // It'll be rendered as part of __NEXT_DATA__ on the client side
    if (publicRuntimeConfig) {
      this.renderOpts.runtimeConfig = publicRuntimeConfig
    }

    // Initialize next/config with the environment configuration
    envConfig.setConfig({
      serverRuntimeConfig,
      publicRuntimeConfig,
    })

    this.routesPromise = this.generateRoutes()
      .then((routes) => {
        this.router.routes = routes
        this.routesPromise = undefined
      })
    this.router = new Router()
    this.setAssetPrefix(assetPrefix)
  }

  private currentPhase(): string {
    return PHASE_PRODUCTION_SERVER
  }

  private logError(...args: any): void {
    if (this.quiet) return
    // tslint:disable-next-line
    console.error(...args)
  }

  private handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl?: UrlWithParsedQuery,
  ): Promise<void> {
    // Parse url if parsedUrl not provided
    if (!parsedUrl || typeof parsedUrl !== 'object') {
      const url: any = req.url
      parsedUrl = parseUrl(url, true)
    }

    // Parse the querystring ourselves if the user doesn't handle querystring parsing
    if (typeof parsedUrl.query === 'string') {
      parsedUrl.query = parseQs(parsedUrl.query)
    }

    res.statusCode = 200
    return this.run(req, res, parsedUrl).catch((err) => {
      this.logError(err)
      res.statusCode = 500
      res.end('Internal Server Error')
    })
  }

  public getRequestHandler() {
    return this.handleRequest.bind(this)
  }

  public setAssetPrefix(prefix?: string) {
    this.renderOpts.assetPrefix = prefix ? prefix.replace(/\/$/, '') : ''
  }

  // Backwards compatibility
  public async prepare(): Promise<void> {}

  // Backwards compatibility
  private async close(): Promise<void> {}

  private setImmutableAssetCacheControl(res: ServerResponse) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  }

  private async generateRoutes(): Promise<Route[]> {
    const routes: Route[] = [
      {
        match: route('/_next/static/:path*'),
        fn: async (req, res, params, parsedUrl) => {
          // The commons folder holds commonschunk files
          // The chunks folder holds dynamic entries
          // The buildId folder holds pages and potentially other assets. As buildId changes per build it can be long-term cached.
          if (
            params.path[0] === CLIENT_STATIC_FILES_RUNTIME ||
            params.path[0] === 'chunks' ||
            params.path[0] === this.buildId
          ) {
            this.setImmutableAssetCacheControl(res)
          }
          const p = join(
            this.distDir,
            CLIENT_STATIC_FILES_PATH,
            ...(params.path || []),
          )
          await this.serveStatic(req, res, p, parsedUrl)
        },
      },
      {
        match: route('/_next/:path*'),
        // This path is needed because `render()` does a check for `/_next` and the calls the routing again
        fn: async (req, res, _params, parsedUrl) => {
          await this.render404(req, res, parsedUrl)
        },
      },
      {
        // It's very important to keep this route's param optional.
        // (but it should support as many params as needed, separated by '/')
        // Otherwise this will lead to a pretty simple DOS attack.
        // See more: https://github.com/zeit/next.js/issues/2617
        match: route('/static/:path*'),
        fn: async (req, res, params, parsedUrl) => {
          const p = join(this.dir, 'static', ...(params.path || []))
          await this.serveStatic(req, res, p, parsedUrl)
        },
      },
    ]

    if (this.nextConfig.useFileSystemPublicRoutes) {
      const renderFn = async (
        req: IncomingMessage,
        res: ServerResponse,
        params: any,
        parsedUrl: UrlWithParsedQuery,
        pathToRender?: string,
      ) => {
        const { pathname, query } = parsedUrl
        if (!pathname) {
          throw new Error('pathname is undefined')
        }
        // @ts-ignore params doesn't exist on req
        req.params = params
        // @ts-ignore query doesn't exist on req
        req.query = query

        // console.log('got params', params);
        return this.render(req, res, (pathToRender || pathname), query, parsedUrl)
      }
      // only do one read of the pages directory
      const allRoutes = await recursiveReadDir(
        join(this.dir, 'pages'), /.*/, true,
      )
      const dynamicRoutes = allRoutes
        .filter((r: string) => (r.split('/').pop() || '').includes('$'))

      // to make sure to prioritize non-dynamic pages inside of
      // dynamic paths we need to load them first
      const dynamicDirs = dynamicRoutes
        .filter((r: string) => !r.includes('.'))

      for (const dynamicDir of dynamicDirs) {
        const nonDynamics = allRoutes
          .filter((r: string) =>
            r.includes(dynamicDir) &&
            !(r.split('/').pop() || '').includes('$'),
          )

        for (const nonDynamic of nonDynamics) {
          const routeNoExt = getRouteNoExt(nonDynamic)
          // console.log('prioritizing', routeNoExt);

          routes.push({
            match: route(routeNoExt.replace(/\$/g, ':')),
            fn: (
              req: IncomingMessage,
              res: ServerResponse,
              params: any,
              parsedUrl: UrlWithParsedQuery,
            ) => renderFn(req, res, params, parsedUrl, routeNoExt),
          })
        }
      }

      // add dynamic routes before the default catch-all
      for (const dynamicRoute of dynamicRoutes) {
        const routeNoExt = getRouteNoExt(dynamicRoute)
        // console.log('adding route', routeNoExt, 'for', routeNoExt);

        routes.push({
          match: route(routeNoExt.replace(/\$/g, ':')),
          fn: (
            req: IncomingMessage,
            res: ServerResponse,
            params: any,
            parsedUrl: UrlWithParsedQuery,
          ) => renderFn(req, res, params, parsedUrl, routeNoExt),
        })
      }

      // It's very important to keep this route's param optional.
      // (but it should support as many params as needed, separated by '/')
      // Otherwise this will lead to a pretty simple DOS attack.
      // See more: https://github.com/zeit/next.js/issues/2617
      routes.push({
        match: route('/:path*'),
        fn: (
          req: IncomingMessage,
          res: ServerResponse,
          params: any,
          parsedUrl: UrlWithParsedQuery,
        ) => renderFn(req, res, params, parsedUrl),
      })
    }

    return routes
  }

  private async run(
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl: UrlWithParsedQuery,
  ) {
    if (this.routesPromise) {
      await this.routesPromise
    }

    try {
      const fn = this.router.match(req, res, parsedUrl)
      if (fn) {
        await fn()
        return
      }
    } catch (err) {
      if (err.code === 'DECODE_FAILED') {
        res.statusCode = 400
        return this.renderError(null, req, res, '/_error', {})
      }
      throw err
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      await this.render404(req, res, parsedUrl)
    } else {
      res.statusCode = 501
      res.end('Not Implemented')
    }
  }

  private async sendHTML(
    req: IncomingMessage,
    res: ServerResponse,
    html: string,
  ) {
    const { generateEtags, poweredByHeader } = this.renderOpts
    return sendHTML(req, res, html, { generateEtags, poweredByHeader })
  }

  public async render(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: ParsedUrlQuery = {},
    parsedUrl?: UrlWithParsedQuery,
  ): Promise<void> {
    const url: any = req.url
    if (isInternalUrl(url)) {
      return this.handleRequest(req, res, parsedUrl)
    }

    if (isBlockedPage(pathname)) {
      return this.render404(req, res, parsedUrl)
    }

    const html = await this.renderToHTML(req, res, pathname, query, {
      dataOnly: this.renderOpts.ampBindInitData && Boolean(query.dataOnly) || (req.headers && (req.headers.accept || '').indexOf('application/amp.bind+json') !== -1),
    })
    // Request was ended by the user
    if (html === null) {
      return
    }

    return this.sendHTML(req, res, html)
  }

  private async renderToHTMLWithComponents(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: ParsedUrlQuery = {},
    opts: any,
  ) {
    const result = await loadComponents(this.distDir, this.buildId, pathname)
    return renderToHTML(req, res, pathname, query, { ...result, ...opts })
  }

  public async renderToHTML(
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: ParsedUrlQuery = {},
    { amphtml, dataOnly, hasAmp }: {
      amphtml?: boolean,
      hasAmp?: boolean,
      dataOnly?: boolean,
    } = {},
  ): Promise<string | null> {
    try {
      // To make sure the try/catch is executed
      const html = await this.renderToHTMLWithComponents(
        req,
        res,
        pathname,
        query,
        { ...this.renderOpts, amphtml, hasAmp, dataOnly },
      )
      return html
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        res.statusCode = 404
        return this.renderErrorToHTML(null, req, res, pathname, query)
      } else {
        this.logError(err)
        res.statusCode = 500
        return this.renderErrorToHTML(err, req, res, pathname, query)
      }
    }
  }

  public async renderError(
    err: Error | null,
    req: IncomingMessage,
    res: ServerResponse,
    pathname: string,
    query: ParsedUrlQuery = {},
  ): Promise<void> {
    res.setHeader(
      'Cache-Control',
      'no-cache, no-store, max-age=0, must-revalidate',
    )
    const html = await this.renderErrorToHTML(err, req, res, pathname, query)
    if (html === null) {
      return
    }
    return this.sendHTML(req, res, html)
  }

  public async renderErrorToHTML(
    err: Error | null,
    req: IncomingMessage,
    res: ServerResponse,
    _pathname: string,
    query: ParsedUrlQuery = {},
  ) {
    return this.renderToHTMLWithComponents(req, res, '/_error', query, {
      ...this.renderOpts,
      err,
    })
  }

  public async render404(
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl?: UrlWithParsedQuery,
  ): Promise<void> {
    const url: any = req.url
    const { pathname, query } = parsedUrl ? parsedUrl : parseUrl(url, true)
    if (!pathname) {
      throw new Error('pathname is undefined')
    }
    res.statusCode = 404
    return this.renderError(null, req, res, pathname, query)
  }

  public async serveStatic(
    req: IncomingMessage,
    res: ServerResponse,
    path: string,
    parsedUrl?: UrlWithParsedQuery,
  ): Promise<void> {
    if (!this.isServeableUrl(path)) {
      return this.render404(req, res, parsedUrl)
    }

    try {
      await serveStatic(req, res, path)
    } catch (err) {
      if (err.code === 'ENOENT' || err.statusCode === 404) {
        this.render404(req, res, parsedUrl)
      } else {
        throw err
      }
    }
  }

  private isServeableUrl(path: string): boolean {
    const resolved = resolve(path)
    if (
      resolved.indexOf(join(this.distDir) + sep) !== 0 &&
      resolved.indexOf(join(this.dir, 'static') + sep) !== 0
    ) {
      // Seems like the user is trying to traverse the filesystem.
      return false
    }

    return true
  }

  private readBuildId(): string {
    const buildIdFile = join(this.distDir, BUILD_ID_FILE)
    try {
      return fs.readFileSync(buildIdFile, 'utf8').trim()
    } catch (err) {
      if (!fs.existsSync(buildIdFile)) {
        throw new Error(
          `Could not find a valid build in the '${
            this.distDir
          }' directory! Try building your app with 'next build' before starting the server.`,
        )
      }

      throw err
    }
  }
}
