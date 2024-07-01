'use client'

import { getExpectedRequestStore } from '../../../client/components/request-async-storage.external'
import { preload } from 'react-dom'

export function PreloadChunks({
  moduleIds,
}: {
  moduleIds: string[] | undefined
}) {
  // Early return in client compilation and only load requestStore on server side
  if (typeof window !== 'undefined') {
    return null
  }

  const requestStore = getExpectedRequestStore('next/dynamic preload')
  const allFiles = []

  // Search the current dynamic call unique key id in react loadable manifest,
  // and find the corresponding CSS files to preload
  if (requestStore.reactLoadableManifest && moduleIds) {
    const manifest = requestStore.reactLoadableManifest
    for (const key of moduleIds) {
      if (!manifest[key]) continue
      const chunks = manifest[key].files
      allFiles.push(...chunks)
    }
  }

  if (allFiles.length === 0) {
    return null
  }

  return (
    <>
      {allFiles.map((chunk) => {
        const href = `${requestStore.assetPrefix}/_next/${encodeURI(chunk)}`
        const isCss = chunk.endsWith('.css')
        // If it's stylesheet we use `precedence` o help hoist with React Float.
        // For stylesheets we actually need to render the CSS because nothing else is going to do it so it needs to be part of the component tree.
        // The `preload` for stylesheet is not optional.
        if (isCss) {
          return (
            <link
              key={chunk}
              // @ts-ignore
              precedence="dynamic"
              href={href}
              rel="stylesheet"
              as="style"
            />
          )
        } else {
          // If it's script we use ReactDOM.preload to preload the resources
          preload(href, {
            as: 'script',
            fetchPriority: 'low',
          })
          return null
        }
      })}
    </>
  )
}
