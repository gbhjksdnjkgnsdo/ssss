import { SERVER_DIRECTORY } from '../../shared/lib/constants'
import { RouteType } from '../route-matches/route-match'
import { AppRouteRouteMatcher } from './app-route-route-matcher'

describe('AppRouteRouteMatcher', () => {
  it('returns no routes with an empty manifest', () => {
    const matcher = new AppRouteRouteMatcher('<root>', {})
    expect(matcher.routes()).toEqual([])
  })

  it('returns the correct routes', () => {
    const matcher = new AppRouteRouteMatcher('<root>', {
      '/dashboard/users/[id]/page': 'app/dashboard/users/[id]/page.js',
      '/dashboard/users/page': 'app/dashboard/users/page.js',
      '/users/[id]/route': 'app/users/[id]/route.js',
      '/users/route': 'app/users/route.js',
    })
    const routes = matcher.routes()

    expect(routes).toHaveLength(2)
    expect(routes).toContainEqual({
      type: RouteType.APP_ROUTE,
      pathname: '/users',
      filename: `<root>/${SERVER_DIRECTORY}/app/users/route.js`,
    })
    expect(routes).toContainEqual({
      type: RouteType.APP_ROUTE,
      pathname: '/users/[id]',
      filename: `<root>/${SERVER_DIRECTORY}/app/users/[id]/route.js`,
    })
  })
})
