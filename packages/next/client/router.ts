/* global window */
import React from 'react'
import Router from '../shared/lib/router/router'
import type { NextRouter, ParsedUrlQuery } from '../shared/lib/router/router'
import { RouterContext } from '../shared/lib/router-context'
import isError from '../lib/is-error'

type ClassArguments<T> = T extends new (...args: infer U) => any ? U : any

type RouterArgs = ClassArguments<typeof Router>

type SingletonRouterBase = {
  router: Router | null
  readyCallbacks: Array<() => any>
  ready(cb: () => any): void
}

export { Router }

export type { NextRouter }

export type SingletonRouter = SingletonRouterBase & NextRouter

const singletonRouter: SingletonRouterBase = {
  router: null, // holds the actual router instance
  readyCallbacks: [],
  ready(cb: () => void) {
    if (this.router) return cb()
    if (typeof window !== 'undefined') {
      this.readyCallbacks.push(cb)
    }
  },
}

// Create public properties and methods of the router in the singletonRouter
const urlPropertyFields = [
  'pathname',
  'route',
  'query',
  'asPath',
  'components',
  'isFallback',
  'basePath',
  'locale',
  'locales',
  'defaultLocale',
  'isReady',
  'isPreview',
  'isLocaleDomain',
  'domainLocales',
]
const routerEvents = [
  'routeChangeStart',
  'beforeHistoryChange',
  'routeChangeComplete',
  'routeChangeError',
  'hashChangeStart',
  'hashChangeComplete',
] as const
export type RouterEvent = typeof routerEvents[number]

const coreMethodFields = [
  'push',
  'replace',
  'reload',
  'back',
  'prefetch',
  'beforePopState',
]

// Events is a static property on the router, the router doesn't have to be initialized to use it
Object.defineProperty(singletonRouter, 'events', {
  get() {
    return Router.events
  },
})

urlPropertyFields.forEach((field: string) => {
  // Here we need to use Object.defineProperty because we need to return
  // the property assigned to the actual router
  // The value might get changed as we change routes and this is the
  // proper way to access it
  Object.defineProperty(singletonRouter, field, {
    get() {
      const router = getRouter() as any
      return router[field] as string
    },
  })
})

coreMethodFields.forEach((field: string) => {
  // We don't really know the types here, so we add them later instead
  ;(singletonRouter as any)[field] = (...args: any[]) => {
    const router = getRouter() as any
    return router[field](...args)
  }
})

routerEvents.forEach((event) => {
  singletonRouter.ready(() => {
    Router.events.on(event, (...args) => {
      const eventField = `on${event.charAt(0).toUpperCase()}${event.substring(
        1
      )}`
      const _singletonRouter = singletonRouter as any
      if (_singletonRouter[eventField]) {
        try {
          _singletonRouter[eventField](...args)
        } catch (err) {
          console.error(`Error when running the Router event: ${eventField}`)
          console.error(
            isError(err) ? `${err.message}\n${err.stack}` : err + ''
          )
        }
      }
    })
  })
})

function getRouter(): Router {
  if (!singletonRouter.router) {
    const message =
      'No router instance found.\n' +
      'You should only use "next/router" on the client side of your app.\n'
    throw new Error(message)
  }
  return singletonRouter.router
}

// Export the singletonRouter and this is the public API.
export default singletonRouter as SingletonRouter

// Reexport the withRoute HOC
export { default as withRouter } from './with-router'

export function useRouter<
  TQueryParams extends ParsedUrlQuery = ParsedUrlQuery
>(): NextRouter<TQueryParams> {
  return React.useContext(RouterContext) as NextRouter<TQueryParams>
}

// INTERNAL APIS
// -------------
// (do not use following exports inside the app)

// Create a router and assign it as the singleton instance.
// This is used in client side when we are initilizing the app.
// This should **not** be used inside the server.
export function createRouter(...args: RouterArgs): Router {
  singletonRouter.router = new Router(...args)
  singletonRouter.readyCallbacks.forEach((cb) => cb())
  singletonRouter.readyCallbacks = []

  return singletonRouter.router
}

// This function is used to create the `withRouter` router instance
export function makePublicRouterInstance(router: Router): NextRouter {
  const scopedRouter = router as any
  const instance = {} as any

  for (const property of urlPropertyFields) {
    if (typeof scopedRouter[property] === 'object') {
      instance[property] = Object.assign(
        Array.isArray(scopedRouter[property]) ? [] : {},
        scopedRouter[property]
      ) // makes sure query is not stateful
      continue
    }

    instance[property] = scopedRouter[property]
  }

  // Events is a static property on the router, the router doesn't have to be initialized to use it
  instance.events = Router.events

  coreMethodFields.forEach((field) => {
    instance[field] = (...args: any[]) => {
      return scopedRouter[field](...args)
    }
  })

  return instance
}
