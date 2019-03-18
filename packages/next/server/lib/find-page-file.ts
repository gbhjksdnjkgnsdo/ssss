import { join } from 'path'
import {isWriteable} from '../../build/is-writeable'

export async function findPageFile(rootDir: string, normalizedPagePath: string, pageExtensions: string[], amp: boolean): Promise<string|null> {
  // Add falling back to .amp.js extension
  if (!amp) pageExtensions = pageExtensions.concat('amp.js')

  for (let extension of pageExtensions) {
    if (amp) extension = 'amp.' + extension
    const relativePagePath = `${normalizedPagePath}.${extension}`
    const pagePath = join(rootDir, relativePagePath)

    if (await isWriteable(pagePath)) {
      return relativePagePath
    }

    const relativePagePathWithIndex = join(normalizedPagePath, `index.${extension}`)
    const pagePathWithIndex = join(rootDir, relativePagePathWithIndex)
    if (await isWriteable(pagePathWithIndex)) {
      return relativePagePathWithIndex
    }
  }

  return null
}
