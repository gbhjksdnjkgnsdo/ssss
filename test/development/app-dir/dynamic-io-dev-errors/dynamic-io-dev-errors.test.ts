import stripAnsi from 'strip-ansi'
import { nextTestSetup } from 'e2e-utils'
import { assertNoRedbox, hasErrorToast, retry } from 'next-test-utils'
import { createSandbox } from 'development-sandbox'
import { outdent } from 'outdent'

describe('Dynamic IO Dev Errors', () => {
  const { isTurbopack, next } = nextTestSetup({
    files: __dirname,
  })

  it('should show a red box error on the SSR render', async () => {
    const browser = await next.browser('/error')

    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 1,
         "description": "[ Server ] Error: Route "/error" used \`Math.random()\` outside of \`"use cache"\` and without explicitly calling \`await connection()\` beforehand. See more info here: https://nextjs.org/docs/messages/next-prerender-random",
         "source": "app/error/page.tsx (2:23) @ Page
       > 2 |   const random = Math.random()
           |                       ^",
         "stack": [
           "JSON.parse <anonymous> (0:0)",
         ],
         "title": "Console Error",
       }
      `)
    } else {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 1,
         "description": "[ Server ] Error: Route "/error" used \`Math.random()\` outside of \`"use cache"\` and without explicitly calling \`await connection()\` beforehand. See more info here: https://nextjs.org/docs/messages/next-prerender-random",
         "source": "app/error/page.tsx (2:23) @ random
       > 2 |   const random = Math.random()
           |                       ^",
         "stack": [
           "JSON.parse <anonymous> (0:0)",
         ],
         "title": "Console Error",
       }
      `)
    }
  })

  it('should show a red box error on client navigations', async () => {
    const browser = await next.browser('/no-error')

    expect(await hasErrorToast(browser)).toBe(false)

    await browser.elementByCss("[href='/error']").click()

    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 1,
         "description": "[ Server ] Error: Route "/error" used \`Math.random()\` outside of \`"use cache"\` and without explicitly calling \`await connection()\` beforehand. See more info here: https://nextjs.org/docs/messages/next-prerender-random",
         "source": "app/error/page.tsx (2:23) @ Page
       > 2 |   const random = Math.random()
           |                       ^",
         "stack": [
           "JSON.parse <anonymous> (0:0)",
         ],
         "title": "Console Error",
       }
      `)
    } else {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 1,
         "description": "[ Server ] Error: Route "/error" used \`Math.random()\` outside of \`"use cache"\` and without explicitly calling \`await connection()\` beforehand. See more info here: https://nextjs.org/docs/messages/next-prerender-random",
         "source": "app/error/page.tsx (2:23) @ random
       > 2 |   const random = Math.random()
           |                       ^",
         "stack": [
           "JSON.parse <anonymous> (0:0)",
         ],
         "title": "Console Error",
       }
      `)
    }
  })

  it('should not log unhandled rejections for persistently thrown top-level errors', async () => {
    const cliOutputLength = next.cliOutput.length
    const res = await next.fetch('/top-level-error')
    expect(res.status).toBe(500)

    await retry(() => {
      const cliOutput = next.cliOutput.slice(cliOutputLength)
      expect(cliOutput).toContain('GET /top-level-error 500')
    })

    expect(next.cliOutput.slice(cliOutputLength)).not.toContain(
      'unhandledRejection'
    )
  })

  // NOTE: when update this snapshot, use `pnpm build` in packages/next to avoid next source code get mapped to source.
  it('should display error when component accessed data without suspense boundary', async () => {
    const outputIndex = next.cliOutput.length
    const browser = await next.browser('/no-accessed-data')

    await retry(() => {
      expect(next.cliOutput.slice(outputIndex)).toContain(
        'Error: Route "/no-accessed-data"'
      )
    })

    expect(stripAnsi(next.cliOutput.slice(outputIndex))).toContain(
      `\nError: Route "/no-accessed-data": ` +
        `A component accessed data, headers, params, searchParams, or a short-lived cache without a Suspense boundary nor a "use cache" above it. ` +
        `We don't have the exact line number added to error messages yet but you can see which component in the stack below. ` +
        `See more info: https://nextjs.org/docs/messages/next-prerender-missing-suspense` +
        '\n    at Page [Server] (<anonymous>)' +
        (isTurbopack
          ? '\n    at main (<anonymous>)' +
            '\n    at body (<anonymous>)' +
            '\n    at html (<anonymous>)' +
            '\n    at Root [Server] (<anonymous>)'
          : // TODO(veil): Should be ignore-listed (see https://linear.app/vercel/issue/NDX-464/next-internals-not-ignore-listed-in-terminal-in-webpack#comment-1164a36a)
            '\n    at tree (..')
    )

    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 1,
         "description": "[ Server ] Error: Route "/no-accessed-data": A component accessed data, headers, params, searchParams, or a short-lived cache without a Suspense boundary nor a "use cache" above it. We don't have the exact line number added to error messages yet but you can see which component in the stack below. See more info: https://nextjs.org/docs/messages/next-prerender-missing-suspense",
         "source": undefined,
         "stack": [
           "Page [Server] <anonymous> (2:1)",
           "main <anonymous> (2:1)",
           "body <anonymous> (2:1)",
           "html <anonymous> (2:1)",
           "Root [Server] <anonymous> (2:1)",
           "JSON.parse <anonymous> (0:0)",
         ],
         "title": "Console Error",
       }
      `)
    } else {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 1,
         "description": "[ Server ] Error: Route "/no-accessed-data": A component accessed data, headers, params, searchParams, or a short-lived cache without a Suspense boundary nor a "use cache" above it. We don't have the exact line number added to error messages yet but you can see which component in the stack below. See more info: https://nextjs.org/docs/messages/next-prerender-missing-suspense",
         "source": undefined,
         "stack": [
           "Page [Server] <anonymous> (2:1)",
           "main <anonymous> (2:1)",
           "body <anonymous> (2:1)",
           "html <anonymous> (2:1)",
           "Root [Server] <anonymous> (2:1)",
           "<FIXME-internal-frame>",
           "JSON.parse <anonymous> (0:0)",
         ],
         "title": "Console Error",
       }
      `)
    }
  })

  it('should clear segment errors after correcting them', async () => {
    await using sandbox = await createSandbox(
      next,
      new Map([
        [
          'app/page.tsx',
          outdent`
          export const revalidate = 10
          export default function Page() {
            return (
              <div>Hello World</div>
            );
          }
        `,
        ],
      ])
    )
    const { browser, session } = sandbox
    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": NaN,
         "description": "Failed to compile",
         "source": "./app/page.tsx:1:14
       Ecmascript file had an error
       > 1 | export const revalidate = 10
           |              ^^^^^^^^^^",
         "stack": [],
         "title": null,
       }
      `)
    } else {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": NaN,
         "description": "Failed to compile",
         "source": "./app/page.tsx
       Error:   x "revalidate" is not compatible with \`nextConfig.experimental.dynamicIO\`. Please remove it.
          ,-[1:1]
        1 | export const revalidate = 10
          :              ^^^^^^^^^^
        2 | export default function Page() {
        3 |   return (
        4 |     <div>Hello World</div>
          \`----",
         "stack": [],
         "title": null,
       }
      `)
    }

    await session.patch(
      'app/page.tsx',
      outdent`
      export default function Page() {
        return (
          <div>Hello World</div>
        );
      }
    `
    )

    await assertNoRedbox(browser)
  })
})
