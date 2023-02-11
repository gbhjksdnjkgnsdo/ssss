/* eslint-disable @typescript-eslint/no-unused-vars */

import { isDynamicRoute } from '../../../shared/lib/router/utils'
import { RouteKind } from '../route-kind'
import { RouteMatch } from '../route-matches/route-match'
import { RouteDefinition } from '../route-definitions/route-definition'
import { RouteMatcherProvider } from '../route-matcher-providers/route-matcher-provider'
import { RouteMatcher } from '../route-matchers/route-matcher'
import { MatchOptions, RouteMatcherManager } from './route-matcher-manager'
import { getSortedRoutes } from '../../../shared/lib/router/utils'

export class DefaultRouteMatcherManager implements RouteMatcherManager {
  private readonly providers: Array<RouteMatcherProvider> = []
  private readonly matchers: {
    static: ReadonlyArray<RouteMatcher>
    dynamic: ReadonlyArray<RouteMatcher>
  } = { static: [], dynamic: [] }
  private cache: ReadonlyArray<RouteMatcher> = []
  private lastCompilationID = this.compilationID

  /**
   * When this value changes, it indicates that a change has been introduced
   * that requires recompilation.
   */
  private get compilationID() {
    return this.providers.length
  }

  private waitTillReadyPromise?: Promise<void>
  public waitTillReady(): Promise<void> {
    return this.waitTillReadyPromise ?? Promise.resolve()
  }

  public async reload() {
    let callbacks: { resolve: Function; reject: Function }
    this.waitTillReadyPromise = new Promise((resolve, reject) => {
      callbacks = { resolve, reject }
    })

    try {
      // Grab the compilation ID for this run, we'll verify it at the end to
      // ensure that if any routes were added before reloading is finished that
      // we error out.
      const compilationID = this.compilationID

      // Collect all the matchers from each provider.
      const matchers: Array<RouteMatcher> = []

      // Get all the providers matchers.
      const providersMatchers: ReadonlyArray<ReadonlyArray<RouteMatcher>> =
        await Promise.all(this.providers.map((provider) => provider.matchers()))

      // Use this to detect duplicate pathnames.
      const all = new Set<string>()
      for (const providerMatchers of providersMatchers) {
        for (const matcher of providerMatchers) {
          if (all.has(matcher.route.pathname)) {
            // TODO: when a duplicate route is detected, what should we do?
            throw new Error(
              `Invariant: duplicate pathname detected '${matcher.route.pathname}', remove one of the conflicting files`
            )
          }

          matchers.push(matcher)

          // Add the matcher's pathname to the set.
          all.add(matcher.route.pathname)
        }
      }

      // If the cache is the same as what we just parsed, we can exit now. We
      // can tell by using the `===` which compares object identity, which for
      // the manifest matchers, will return the same matcher each time.
      if (
        this.cache.length === matchers.length &&
        this.cache.every(
          (cachedMatcher, index) => cachedMatcher === matchers[index]
        )
      ) {
        return
      }
      this.cache = matchers

      // For matchers that are for static routes, filter them now.
      this.matchers.static = matchers.filter((matcher) => !matcher.isDynamic)

      // For matchers that are for dynamic routes, filter them and sort them now.
      const dynamic = matchers.filter((matcher) => matcher.isDynamic)

      // Because `getSortedRoutes` only accepts an array of strings, we need to
      // build a reference between the pathnames used for dynamic routing and
      // the underlying matchers used to perform the match for each route. We
      // take the fact that the pathnames are unique to build a reference of
      // their original index in the array so that when we call
      // `getSortedRoutes`, we can lookup the associated matcher.

      // Generate a filename to index map, this will be used to re-sort the array.
      const indexes = new Map<string, number>()
      const pathnames = new Array<string>(dynamic.length)
      for (let index = 0; index < dynamic.length; index++) {
        const pathname = dynamic[index].route.pathname
        if (indexes.has(pathname)) {
          throw new Error('Invariant: duplicate dynamic route detected')
        }

        indexes.set(pathname, index)
        pathnames[index] = pathname
      }

      // Sort the array of pathnames.
      const sorted = getSortedRoutes(pathnames)
      const sortedDynamicMatchers = new Array<RouteMatcher>(sorted.length)
      for (let i = 0; i < sorted.length; i++) {
        const pathname = sorted[i]

        const index = indexes.get(pathname)
        if (typeof index !== 'number') {
          throw new Error('Invariant: expected to find pathname in indexes map')
        }

        sortedDynamicMatchers[i] = dynamic[index]
      }

      this.matchers.dynamic = sortedDynamicMatchers

      // This means that there was a new matcher pushed while we were waiting
      if (this.compilationID !== compilationID) {
        throw new Error(
          'Invariant: expected compilation to finish before new matchers were added, possible missing await'
        )
      }

      // The compilation ID matched, so mark the complication as finished.
      this.lastCompilationID = compilationID
    } catch (err) {
      callbacks!.reject(err)
    } finally {
      callbacks!.resolve()
    }
  }

  public push(provider: RouteMatcherProvider): void {
    this.providers.push(provider)
  }

  public async test(
    pathname: string,
    options?: MatchOptions | undefined
  ): Promise<boolean> {
    // See if there's a match for the pathname...
    const match = await this.match(pathname, options)

    // This default implementation only needs to check to see if there _was_ a
    // match. The development matcher actually changes it's behavior by not
    // recompiling the routes.
    return match !== null
  }

  public async match(
    pathname: string,
    options?: MatchOptions
  ): Promise<RouteMatch<RouteDefinition<RouteKind>> | null> {
    // "Iterate" over the match options. Once we found a single match, exit with
    // it, otherwise return null below. If no match is found, the inner block
    // won't be called.
    for await (const match of this.matchAll(pathname, options)) {
      return match
    }

    return null
  }

  public async *matchAll(
    pathname: string,
    options?: MatchOptions | undefined
  ): AsyncGenerator<RouteMatch<RouteDefinition<RouteKind>>, null, undefined> {
    // Guard against the matcher manager from being run before it needs to be
    // recompiled. This was preferred to re-running the compilation here because
    // it should be re-ran only when it changes. If a match is attempted before
    // this is done, it indicates that there is a case where a provider is added
    // before it was recompiled (an error). We also don't want to affect request
    // times.
    if (this.lastCompilationID !== this.compilationID) {
      throw new Error('Invariant: expected routes to be compiled before match')
    }

    // If this pathname doesn't look like a dynamic route, and this pathname is
    // listed in the normalized list of routes, then return it. This ensures
    // that when a route like `/user/[id]` is encountered, it doesn't just match
    // with the list of normalized routes.
    if (!isDynamicRoute(pathname)) {
      for (const matcher of this.matchers.static) {
        const match = matcher.match(pathname)
        if (!match) continue

        yield match
      }
    }

    // If we should skip handling dynamic routes, exit now.
    if (options?.skipDynamic) return null

    // Loop over the dynamic matchers, yielding each match.
    for (const matcher of this.matchers.dynamic) {
      const match = matcher.match(pathname)
      if (!match) continue

      yield match
    }

    // We tried direct matching against the pathname and against all the dynamic
    // paths, so there was no match.
    return null
  }
}
