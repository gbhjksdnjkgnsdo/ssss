import path from 'path'
import { isAppRouteRoute } from '../../lib/is-app-route-route'
import {
  APP_PATHS_MANIFEST,
  SERVER_DIRECTORY,
} from '../../shared/lib/constants'
import { normalizeAppRoute } from '../../shared/lib/router/utils/app-paths'
import { RouteType } from '../route-matches/route-match'
import { Route, RouteMatcher } from './route-matcher'

export class AppRouteRouteMatcher implements RouteMatcher<RouteType.APP_ROUTE> {
  constructor(
    private readonly distDir: string,
    private readonly appPathsManifest: Record<
      string,
      string
    > = require(path.join(distDir, SERVER_DIRECTORY, APP_PATHS_MANIFEST))
  ) {}

  public routes(): ReadonlyArray<Route<RouteType.APP_ROUTE>> {
    return (
      Object.keys(this.appPathsManifest)
        // This matcher only matches app routes.
        .filter((route) => isAppRouteRoute(route))
        // Normalize the routes.
        .reduce<Array<Route<RouteType.APP_ROUTE>>>((routes, route) => {
          const pathname = normalizeAppRoute(route)

          // If the route was already added, then don't add it again.
          if (routes.find((r) => r.pathname === pathname)) return routes

          routes.push({
            type: RouteType.APP_ROUTE,
            pathname,
            filename: path.join(
              this.distDir,
              SERVER_DIRECTORY,
              this.appPathsManifest[route]
            ),
          })

          return routes
        }, [])
    )
  }
}
