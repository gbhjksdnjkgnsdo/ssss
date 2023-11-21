/* eslint-env jest */
import { existsSync } from 'fs'
import { createFile, readFile, writeFile, rm } from 'fs/promises'
import { nextBuild } from 'next-test-utils'
import path from 'path'
;(process.env.TURBOPACK ? describe.skip : describe)(
  'tsconfig.json verifier',
  () => {
    const appDir = path.join(__dirname, '../')
    const tsConfig = path.join(appDir, 'tsconfig.json')
    const tsConfigBase = path.join(appDir, 'tsconfig.base.json')

    beforeEach(async () => {
      await rm(tsConfig, { recursive: true, force: true })
      await rm(tsConfigBase, { recursive: true, force: true })
    })

    afterEach(async () => {
      await rm(tsConfig, { recursive: true, force: true })
      await rm(tsConfigBase, { recursive: true, force: true })
    })

    it('Creates a default tsconfig.json when one is missing', async () => {
      expect(existsSync(tsConfig)).toBe(false)
      const { code } = await nextBuild(appDir)
      expect(code).toBe(0)
      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "node",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      "
    `)
    })

    it('Works with an empty tsconfig.json (docs)', async () => {
      expect(existsSync(tsConfig)).toBe(false)

      await createFile(tsConfig)
      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(await readFile(tsConfig, 'utf8')).toBe('')

      const { code, stderr, stdout } = await nextBuild(appDir, undefined, {
        stderr: true,
        stdout: true,
      })
      expect(stderr + stdout).not.toContain('moduleResolution')
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "node",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      "
    `)
    })

    it('Updates an existing tsconfig.json without losing comments', async () => {
      expect(existsSync(tsConfig)).toBe(false)

      await writeFile(
        tsConfig,
        `
      // top-level comment
      {
        // in-object comment 1
        "compilerOptions": {
          // in-object comment
          "esModuleInterop": false, // this should be true
          "module": "umd" // should not be umd
          // end-object comment
        }
        // in-object comment 2
      }
      // end comment
      `
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { code } = await nextBuild(appDir)
      expect(code).toBe(0)

      // Weird comma placement until this issue is resolved:
      // https://github.com/kaelzhang/node-comment-json/issues/21
      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "// top-level comment
      {
        // in-object comment 1
        "compilerOptions": {
          // in-object comment
          "esModuleInterop": true, // this should be true
          "module": "esnext" // should not be umd
          // end-object comment
          ,
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "moduleResolution": "node",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        }
        // in-object comment 2
        ,
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      // end comment
      "
    `)
    })

    it('allows you to set commonjs module mode', async () => {
      expect(existsSync(tsConfig)).toBe(false)

      await writeFile(
        tsConfig,
        `{ "compilerOptions": { "esModuleInterop": false, "module": "commonjs" } }`
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { code } = await nextBuild(appDir)
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "esModuleInterop": true,
          "module": "commonjs",
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "moduleResolution": "node",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      "
    `)
    })

    it('allows you to set es2020 module mode', async () => {
      expect(existsSync(tsConfig)).toBe(false)

      await writeFile(
        tsConfig,
        `{ "compilerOptions": { "esModuleInterop": false, "module": "es2020" } }`
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { code } = await nextBuild(appDir)
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "esModuleInterop": true,
          "module": "es2020",
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "moduleResolution": "node",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      "
    `)
    })

    it('allows you to set node16 moduleResolution mode', async () => {
      expect(existsSync(tsConfig)).toBe(false)

      await writeFile(
        tsConfig,
        `{ "compilerOptions": { "esModuleInterop": false, "moduleResolution": "node16", "module": "node16" } }`
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { code, stderr, stdout } = await nextBuild(appDir, undefined, {
        stderr: true,
        stdout: true,
      })
      expect(stderr + stdout).not.toContain('moduleResolution')
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "esModuleInterop": true,
          "moduleResolution": "node16",
          "module": "node16",
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      "
    `)
    })

    it('allows you to set bundler moduleResolution mode', async () => {
      expect(existsSync(tsConfig)).toBe(false)

      await writeFile(
        tsConfig,
        `{ "compilerOptions": { "esModuleInterop": false, "moduleResolution": "bundler" } }`
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { code, stderr, stdout } = await nextBuild(appDir, undefined, {
        stderr: true,
        stdout: true,
      })
      expect(stderr + stdout).not.toContain('moduleResolution')
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "esModuleInterop": true,
          "moduleResolution": "bundler",
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "module": "esnext",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      "
    `)
    })

    it('allows you to set target mode', async () => {
      expect(existsSync(tsConfig)).toBe(false)

      await writeFile(tsConfig, `{ "compilerOptions": { "target": "es2022" } }`)
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { code, stderr, stdout } = await nextBuild(appDir, undefined, {
        stderr: true,
        stdout: true,
      })
      expect(stderr + stdout).not.toContain('target')
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "target": "es2022",
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "node",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      "
    `)
    })

    it('allows you to set node16 module mode', async () => {
      expect(existsSync(tsConfig)).toBe(false)

      await writeFile(
        tsConfig,
        `{ "compilerOptions": { "esModuleInterop": false, "module": "node16", "moduleResolution": "node16" } }`
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { code, stderr, stdout } = await nextBuild(appDir, undefined, {
        stderr: true,
        stdout: true,
      })
      expect(stderr + stdout).not.toContain('moduleResolution')
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "esModuleInterop": true,
          "module": "node16",
          "moduleResolution": "node16",
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      "
    `)
    })

    it('allows you to set verbatimModuleSyntax true without adding isolatedModules', async () => {
      expect(existsSync(tsConfig)).toBe(false)

      await writeFile(
        tsConfig,
        `{ "compilerOptions": { "verbatimModuleSyntax": true } }`
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { code, stderr, stdout } = await nextBuild(appDir, undefined, {
        stderr: true,
        stdout: true,
      })
      expect(stderr + stdout).not.toContain('isolatedModules')
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "verbatimModuleSyntax": true,
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "noEmit": true,
          "incremental": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "node",
          "resolveJsonModule": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      "
    `)
    })

    it('allows you to set verbatimModuleSyntax true via extends without adding isolatedModules', async () => {
      expect(existsSync(tsConfig)).toBe(false)
      expect(existsSync(tsConfigBase)).toBe(false)

      await writeFile(
        tsConfigBase,
        `{ "compilerOptions": { "verbatimModuleSyntax": true } }`
      )
      await writeFile(tsConfig, `{ "extends": "./tsconfig.base.json" }`)
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { code, stderr, stdout } = await nextBuild(appDir, undefined, {
        stderr: true,
        stdout: true,
      })
      expect(stderr + stdout).not.toContain('isolatedModules')
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
        "{
          "extends": "./tsconfig.base.json",
          "compilerOptions": {
            "lib": [
              "dom",
              "dom.iterable",
              "esnext"
            ],
            "allowJs": true,
            "skipLibCheck": true,
            "strict": false,
            "noEmit": true,
            "incremental": true,
            "esModuleInterop": true,
            "module": "esnext",
            "moduleResolution": "node",
            "resolveJsonModule": true,
            "jsx": "preserve",
            "plugins": [
              {
                "name": "next"
              }
            ],
            "strictNullChecks": true
          },
          "include": [
            "next-env.d.ts",
            ".next/types/**/*.ts",
            "**/*.ts",
            "**/*.tsx"
          ],
          "exclude": [
            "node_modules"
          ]
        }
        "
      `)
    })

    it('allows you to extend another configuration file', async () => {
      expect(existsSync(tsConfig)).toBe(false)
      expect(existsSync(tsConfigBase)).toBe(false)

      await writeFile(
        tsConfigBase,
        `
      {
        "compilerOptions": {
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "forceConsistentCasingInFileNames": true,
          "noEmit": true,
          "incremental": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "bundler",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      `
      )
      await new Promise((resolve) => setTimeout(resolve, 500))

      await writeFile(tsConfig, `{ "extends": "./tsconfig.base.json" }`)
      await new Promise((resolve) => setTimeout(resolve, 500))

      const { code, stderr, stdout } = await nextBuild(appDir, undefined, {
        stderr: true,
        stdout: true,
      })
      expect(stderr + stdout).not.toContain('moduleResolution')
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(
        `"{ "extends": "./tsconfig.base.json" }"`
      )
    })

    it('creates compilerOptions when you extend another config', async () => {
      expect(existsSync(tsConfig)).toBe(false)
      expect(existsSync(tsConfigBase)).toBe(false)

      await writeFile(
        tsConfigBase,
        `
      {
        "compilerOptions": {
          "lib": [
            "dom",
            "dom.iterable",
            "esnext"
          ],
          "allowJs": true,
          "skipLibCheck": true,
          "strict": false,
          "forceConsistentCasingInFileNames": true,
          "noEmit": true,
          "esModuleInterop": true,
          "module": "esnext",
          "moduleResolution": "bundler",
          "resolveJsonModule": true,
          "isolatedModules": true,
          "jsx": "preserve",
          "plugins": [
            {
              "name": "next"
            }
          ],
          "strictNullChecks": true
        },
        "include": [
          "next-env.d.ts",
          ".next/types/**/*.ts",
          "**/*.ts",
          "**/*.tsx"
        ],
        "exclude": [
          "node_modules"
        ]
      }
      `
      )
      await new Promise((resolve) => setTimeout(resolve, 500))

      await writeFile(tsConfig, `{ "extends": "./tsconfig.base.json" }`)
      await new Promise((resolve) => setTimeout(resolve, 500))

      const { code, stderr, stdout } = await nextBuild(appDir, undefined, {
        stderr: true,
        stdout: true,
      })
      expect(stderr + stdout).not.toContain('moduleResolution')
      expect(code).toBe(0)

      expect(await readFile(tsConfig, 'utf8')).toMatchInlineSnapshot(`
      "{
        "extends": "./tsconfig.base.json",
        "compilerOptions": {
          "incremental": true,
          "strictNullChecks": true
        }
      }
      "
    `)
    })
  }
)
