/* eslint-env jest */
import { sandbox } from 'development-sandbox'
import { FileRef, nextTestSetup } from 'e2e-utils'
import path from 'path'

describe('Component Stack in error overlay', () => {
  const { next } = nextTestSetup({
    files: new FileRef(path.join(__dirname, 'fixtures', 'component-stack')),
    dependencies: {
      react: 'latest',
      'react-dom': 'latest',
    },
    skipStart: true,
  })

  it('should show a component stack on hydration error', async () => {
    const { cleanup, session } = await sandbox(next)

    await session.waitForAndOpenRuntimeError()

    if (process.env.TURBOPACK) {
      expect(await session.getRedboxComponentStack()).toMatchInlineSnapshot(`
        "p
        div
        Component
        main
        InnerLayoutRouter
        http (NaN:NaN)
        RedirectErrorBoundary
        http (NaN:NaN)
        RedirectBoundary
        http (NaN:NaN)
        NotFoundErrorBoundary
        http (NaN:NaN)
        NotFoundBoundary
        http (NaN:NaN)
        LoadingBoundary
        http (NaN:NaN)
        ErrorBoundary
        http (NaN:NaN)
        InnerScrollAndFocusHandler
        http (NaN:NaN)
        ScrollAndFocusHandler
        http (NaN:NaN)
        RenderFromTemplateContext
        http (NaN:NaN)
        OuterLayoutRouter
        http (NaN:NaN)
        body
        html
        RedirectErrorBoundary
        http (NaN:NaN)
        RedirectBoundary
        http (NaN:NaN)
        NotFoundErrorBoundary
        http (NaN:NaN)
        NotFoundBoundary
        http (NaN:NaN)
        DevRootNotFoundBoundary
        http (NaN:NaN)
        ReactDevOverlay
        http (NaN:NaN)
        HotReload
        http (NaN:NaN)
        Router
        http (NaN:NaN)
        ErrorBoundaryHandler
        http (NaN:NaN)
        ErrorBoundary
        http (NaN:NaN)
        AppRouter
        http (NaN:NaN)
        ServerRoot
        http (NaN:NaN)
        RSCComponent
        Root
        http (NaN:NaN)"
      `)
    } else {
      expect(await session.getRedboxComponentStack()).toMatchInlineSnapshot(`
        "p
        div
        Component
        main"
      `)
    }

    await cleanup()
  })
})
