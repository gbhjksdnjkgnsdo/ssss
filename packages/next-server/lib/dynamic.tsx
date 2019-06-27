import React from 'react'
import Loadable from './loadable'

const isServerSide = typeof window === 'undefined'

export type LoaderComponent<P = {}> = Promise<
  React.ComponentType<P> | { default: React.ComponentType<P> }
>

export type Loader<P = {}> = (() => LoaderComponent<P>) | LoaderComponent<P>

export type LoaderMap = { [mdule: string]: () => Loader<any> }

export type LoadableGeneratedOptions = {
  webpack?(): any
  modules?(): LoaderMap
}

export type LoadableBaseOptions<P = {}> = LoadableGeneratedOptions & {
  loading?: ({
    error,
    isLoading,
    pastDelay,
  }: {
    error?: Error | null
    isLoading?: boolean
    pastDelay?: boolean
    timedOut?: boolean
  }) => JSX.Element | null
  loader?: Loader<P> | LoaderMap
  loadableGenerated?: LoadableGeneratedOptions
  ssr?: boolean
}

export type LoadableOptions<P = {}> = LoadableBaseOptions<P> & {
  render?(loader: any, props: any): JSX.Element
}

export type DynamicOptions<P = {}> = LoadableBaseOptions<P> & {
  render?(props: P, loaded: any): JSX.Element
}

export type LoadableFn<P = {}> = (
  opts: LoadableOptions<P>
) => React.ComponentType<P>

export type LoadableComponent<P = {}> = React.ComponentType<P>

export function noSSR<P = {}>(
  LoadableInitializer: LoadableFn<P>,
  loadableOptions: LoadableOptions<P>
) {
  // Removing webpack and modules means react-loadable won't try preloading
  delete loadableOptions.webpack
  delete loadableOptions.modules

  // This check is neccesary to prevent react-loadable from initializing on the server
  if (!isServerSide) {
    return LoadableInitializer(loadableOptions)
  }

  const Loading = loadableOptions.loading!
  // This will only be rendered on the server side
  return () => (
    <Loading error={null} isLoading pastDelay={false} timedOut={false} />
  )
}

function DefaultLoading() {
  return <p>loading...</p>
}

// function dynamic<P = {}, O extends DynamicOptions>(options: O):

export default function dynamic<P = {}>(
  dynamicOptions: DynamicOptions<P> | Loader<P>,
  options?: DynamicOptions<P>
): React.ComponentType<P> {
  let loadableFn: LoadableFn<P> = Loadable
  let loadableOptions: LoadableOptions<P> = {
    // A loading component is not required, so we default it
    loading: ({ error, isLoading, pastDelay }) => {
      if (!pastDelay) return null
      if (process.env.NODE_ENV === 'development') {
        if (isLoading) {
          return <DefaultLoading />
        }
        if (error) {
          return (
            <p>
              {error.message}
              <br />
              {error.stack}
            </p>
          )
        }
      }

      return <DefaultLoading />
    },
  }

  // Support for direct import(), eg: dynamic(import('../hello-world'))
  // Note that this is only kept for the edge case where someone is passing in a promise as first argument
  // The react-loadable babel plugin will turn dynamic(import('../hello-world')) into dynamic(() => import('../hello-world'))
  // To make sure we don't execute the import without rendering first
  if (dynamicOptions instanceof Promise) {
    loadableOptions.loader = () => dynamicOptions
    // Support for having import as a function, eg: dynamic(() => import('../hello-world'))
  } else if (typeof dynamicOptions === 'function') {
    loadableOptions.loader = dynamicOptions
    // Support for having first argument being options, eg: dynamic({loader: import('../hello-world')})
  } else if (typeof dynamicOptions === 'object') {
    loadableOptions = { ...loadableOptions, ...dynamicOptions }
  }

  // Support for passing options, eg: dynamic(import('../hello-world'), {loading: () => <p>Loading something</p>})
  loadableOptions = { ...loadableOptions, ...options }

  // coming from build/babel/plugins/react-loadable-plugin.js
  if (loadableOptions.loadableGenerated) {
    loadableOptions = {
      ...loadableOptions,
      ...loadableOptions.loadableGenerated,
    }
    delete loadableOptions.loadableGenerated
  }

  // support for disabling server side rendering, eg: dynamic(import('../hello-world'), {ssr: false})
  if (typeof loadableOptions.ssr === 'boolean') {
    if (!loadableOptions.ssr) {
      delete loadableOptions.ssr
      return noSSR(loadableFn, loadableOptions)
    }
    delete loadableOptions.ssr
  }

  return loadableFn(loadableOptions)
}
