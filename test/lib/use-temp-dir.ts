import fsp from 'fs/promises'
import os from 'os'
import path from 'path'

/**
 * Create a randomly-named directory in `os.tmpdir()`, await a function call,
 * and delete the directory when finished, unless `NEXT_TEST_SKIP_CLEANUP` is set.
 */
export async function useTempDir(
  fn: (folder: string) => void | Promise<void>,
  mode?: string | number
) {
  const folder = path.join(
    os.tmpdir(),
    'next-test-' + Math.random().toString(36).slice(2)
  )
  await fsp.mkdir(folder, { recursive: true })

  if (mode) {
    await fsp.chmod(folder, mode)
  }

  try {
    await fn(folder)
  } finally {
    if (!process.env.NEXT_TEST_SKIP_CLEANUP) {
      await fsp.rm(folder, { recursive: true, force: true })
    }
  }
}
