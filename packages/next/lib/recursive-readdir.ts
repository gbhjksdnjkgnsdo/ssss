import fs from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

/**
 * Recursively read directory
 * @param  {string} dir Directory to read
 * @param  {RegExp} filter Filter for the file name, only the name part is considered, not the full path
 * @param  {string[]=[]} arr This doesn't have to be provided, it's used for the recursion
 * @param  {string=dir`} rootDir Used to replace the initial path, only the relative path is left, it's faster than path.relative.
 * @returns Promise array holding all relative paths
 */
export async function recursiveReadDir(dir: string, filter: RegExp, includeDirs = false, arr: string[] = [], rootDir: string = dir): Promise<string[]> {
  const result = await readdir(dir)

  await Promise.all(result.map(async (part: string) => {
    const absolutePath = join(dir, part)
    const pathStat = await stat(absolutePath)

    if (pathStat.isDirectory()) {
      if (includeDirs) arr.push(absolutePath.replace(rootDir, ''))
      await recursiveReadDir(absolutePath, filter, includeDirs, arr, rootDir)
      return
    }

    if (!filter.test(part)) {
      return
    }

    arr.push(absolutePath.replace(rootDir, ''))
  }))

  return arr
}
