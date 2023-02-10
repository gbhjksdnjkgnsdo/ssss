import type webpack from 'webpack'
import type { AppLoaderOptions } from '../next-app-loader'
import path from 'path'
import { stringify } from 'querystring'

const METADATA_TYPE = 'metadata'

export const METADATA_IMAGE_RESOURCE_QUERY = '?__next_metadata'

const staticAssetIconsImage = {
  icon: {
    filename: 'icon',
    extensions: ['ico', 'jpg', 'jpeg', 'png', 'svg'],
  },
  apple: {
    filename: 'apple-icon',
    extensions: ['jpg', 'jpeg', 'png', 'svg'],
  },
  favicon: {
    filename: 'favicon',
    extensions: ['ico'],
  },
}

// Produce all compositions with filename (icon, apple-icon, etc.) with extensions (png, jpg, etc.)
async function enumMetadataFiles(
  dir: string,
  filename: string,
  extensions: string[],
  {
    resolvePath,
    loaderContext,
  }: {
    resolvePath: (pathname: string) => Promise<string>
    loaderContext: webpack.LoaderContext<any>
  }
) {
  const collectedFiles: string[] = []
  // Possible filename without extension could: icon, icon0, ..., icon9
  const possibleFileNames = [filename].concat(
    Array(10)
      .fill(0)
      .map((_, index) => filename + index)
  )
  for (const name of possibleFileNames) {
    for (const ext of extensions) {
      const pathname = path.join(dir, `${name}.${ext}`)
      try {
        const resolved = await resolvePath(pathname)
        loaderContext.addDependency(resolved)

        collectedFiles.push(resolved)
      } catch (err: any) {
        if (!err.message.includes("Can't resolve")) {
          throw err
        }
        loaderContext.addMissingDependency(pathname)
      }
    }
  }

  return collectedFiles
}

export async function discoverStaticMetadataFiles(
  resolvedDir: string,
  {
    resolvePath,
    isRootLayer,
    loaderContext,
    loaderOptions,
  }: {
    resolvePath: (pathname: string) => Promise<string>
    isRootLayer: boolean
    loaderContext: webpack.LoaderContext<any>
    loaderOptions: AppLoaderOptions
  }
) {
  let hasStaticMetadataFiles = false
  const iconsMetadata: {
    icon: string[]
    apple: string[]
  } = {
    icon: [],
    apple: [],
  }

  const opts = {
    resolvePath,
    loaderContext,
  }

  const metadataImageLoaderOptions = {
    isDev: loaderOptions.isDev,
    assetPrefix: loaderOptions.assetPrefix,
  }

  async function collectIconModuleIfExists(type: 'icon' | 'apple' | 'favicon') {
    const resolvedMetadataFiles = await enumMetadataFiles(
      resolvedDir,
      staticAssetIconsImage[type].filename,
      staticAssetIconsImage[type].extensions,
      opts
    )
    resolvedMetadataFiles
      .sort((a, b) => a.localeCompare(b))
      .forEach((filepath) => {
        const iconModule = `() => import(/* webpackMode: "eager" */ ${JSON.stringify(
          `next-metadata-image-loader?${stringify(
            metadataImageLoaderOptions
          )}!` +
            filepath +
            METADATA_IMAGE_RESOURCE_QUERY
        )})`

        hasStaticMetadataFiles = true
        if (type === 'favicon') {
          iconsMetadata.icon.unshift(iconModule)
        } else {
          iconsMetadata[type].push(iconModule)
        }
      })
  }

  await Promise.all([
    collectIconModuleIfExists('icon'),
    collectIconModuleIfExists('apple'),
    isRootLayer && collectIconModuleIfExists('favicon'),
  ])

  return hasStaticMetadataFiles ? iconsMetadata : null
}

export function buildMetadata(
  metadata: Awaited<ReturnType<typeof discoverStaticMetadataFiles>>
) {
  return metadata
    ? `${METADATA_TYPE}: {
    icon: [${metadata.icon.join(',')}],
    apple: [${metadata.apple.join(',')}]
  }`
    : ''
}
