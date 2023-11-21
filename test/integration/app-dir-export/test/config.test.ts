import fsp from 'fs/promises'
import { nextBuild, runNextCommand } from 'next-test-utils'
import { join } from 'path'
import {
  appDir,
  distDir,
  expectedWhenTrailingSlashTrue,
  exportDir,
  getFiles,
  nextConfig,
} from './utils'

describe('app dir - with output export (next dev / next build)', () => {
  ;(process.env.TURBOPACK ? describe.skip : describe)('production mode', () => {
    it('should throw when exportPathMap configured', async () => {
      nextConfig.replace(
        'trailingSlash: true,',
        `trailingSlash: true,
       exportPathMap: async function (map) {
        return map
      },`
      )
      await fsp.rm(distDir, { recursive: true, force: true })
      await fsp.rm(exportDir, { recursive: true, force: true })
      let result = { code: 0, stderr: '' }
      try {
        result = await nextBuild(appDir, [], { stderr: true })
      } finally {
        nextConfig.restore()
      }
      expect(result.code).toBe(1)
      expect(result.stderr).toContain(
        'The "exportPathMap" configuration cannot be used with the "app" directory. Please use generateStaticParams() instead.'
      )
    })
    it('should error when running next export', async () => {
      await fsp.rm(distDir, { recursive: true, force: true })
      await fsp.rm(exportDir, { recursive: true, force: true })
      nextConfig.delete()
      try {
        await nextBuild(appDir)
        expect(await getFiles()).toEqual([])
        let stdout = ''
        let stderr = ''
        let error = undefined
        try {
          await runNextCommand(['export', appDir], {
            onStdout(msg) {
              stdout += msg
            },
            onStderr(msg) {
              stderr += msg
            },
          })
        } catch (e) {
          error = e
        }
        expect(error).toBeDefined()
        expect(stderr).toContain(
          'The "next export" command has been removed in favor of "output: export" in next.config.js'
        )
        expect(stdout).not.toContain('Export successful. Files written to')
        expect(await getFiles()).toEqual([])
      } finally {
        nextConfig.restore()
        await fsp.rm(distDir, { recursive: true, force: true })
        await fsp.rm(exportDir, { recursive: true, force: true })
      }
    })
    it('should correctly emit exported assets to config.distDir', async () => {
      const outputDir = join(appDir, 'output')
      await fsp.rm(distDir, { recursive: true, force: true })
      await fsp.rm(outputDir, { recursive: true, force: true })
      nextConfig.replace(
        'trailingSlash: true,',
        `trailingSlash: true,
       distDir: 'output',`
      )
      try {
        await nextBuild(appDir)
        expect(await getFiles(outputDir)).toEqual(expectedWhenTrailingSlashTrue)
      } finally {
        nextConfig.restore()
        await fsp.rm(distDir, { recursive: true, force: true })
        await fsp.rm(outputDir, { recursive: true, force: true })
      }
    })
  })
})
