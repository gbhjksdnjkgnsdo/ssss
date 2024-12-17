import { nextTestSetup } from 'e2e-utils'

describe('app-dir - capture-console-error', () => {
  const { isTurbopack, next } = nextTestSetup({
    files: __dirname,
  })

  if (process.env.__NEXT_EXPERIMENTAL_PPR === 'true') {
    it('skip test for experimental PPR', () => {
      // Cover these tests in the owner stack tests suite
    })
    return
  }

  it('should capture browser console error and format the error message', async () => {
    const browser = await next.browser('/browser/event')
    await browser.elementByCss('button').click()

    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 1,
         "description": "trigger an console <error>",
         "source": "app/browser/event/page.js (7:17) @ onClick
       >  7 |         console.error('trigger an console <%s>', 'error')
            |                 ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    } else {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 1,
         "description": "trigger an console <error>",
         "source": "app/browser/event/page.js (7:17) @ error
       >  7 |         console.error('trigger an console <%s>', 'error')
            |                 ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    }
  })

  it('should capture browser console error in render and dedupe if necessary', async () => {
    const browser = await next.browser('/browser/render')

    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 2,
         "description": "trigger an console.error in render",
         "source": "app/browser/render/page.js (4:11) @ Page
         2 |
       > 4 |   console.error('trigger an console.error in render')
           |           ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    } else {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 2,
         "description": "trigger an console.error in render",
         "source": "app/browser/render/page.js (4:11) @ error
         2 |
       > 4 |   console.error('trigger an console.error in render')
           |           ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    }
  })

  it('should capture browser console error in render and dedupe when multi same errors logged', async () => {
    const browser = await next.browser('/browser/render')

    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 2,
         "description": "trigger an console.error in render",
         "source": "app/browser/render/page.js (4:11) @ Page
         2 |
       > 4 |   console.error('trigger an console.error in render')
           |           ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    } else {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 2,
         "description": "trigger an console.error in render",
         "source": "app/browser/render/page.js (4:11) @ error
         2 |
       > 4 |   console.error('trigger an console.error in render')
           |           ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    }
  })

  it('should capture server replay string error from console error', async () => {
    const browser = await next.browser('/ssr')

    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 2,
         "description": "ssr console error:client",
         "source": "app/ssr/page.js (4:11) @ Page
         2 |
       > 4 |   console.error(
           |           ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    } else {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 2,
         "description": "ssr console error:client",
         "source": "app/ssr/page.js (4:11) @ error
         2 |
       > 4 |   console.error(
           |           ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    }
  })

  it('should capture server replay error instance from console error', async () => {
    const browser = await next.browser('/ssr-error-instance')

    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 2,
         "description": "Error: page error",
         "source": "app/ssr-error-instance/page.js (4:17) @ Page
         2 |
       > 4 |   console.error(new Error('page error'))
           |                 ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    } else {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 2,
         "description": "Error: page error",
         "source": "app/ssr-error-instance/page.js (4:17) @ Page
         2 |
       > 4 |   console.error(new Error('page error'))
           |                 ^",
         "stack": [],
         "title": "Console Error",
       }
      `)
    }
  })

  it('should be able to capture rsc logged error', async () => {
    const browser = await next.browser('/rsc')

    if (isTurbopack) {
      await expect(browser).toDisplayCollapsedRedbox(`
       {
         "count": 1,
         "description": "[ Server ] Error: boom",
         "source": "app/rsc/page.js (2:17) @ Page
       > 2 |   console.error(new Error('boom'))
           |                 ^",
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
         "description": "[ Server ] Error: boom",
         "source": "app/rsc/page.js (2:17) @ Page
       > 2 |   console.error(new Error('boom'))
           |                 ^",
         "stack": [
           "JSON.parse <anonymous> (0:0)",
         ],
         "title": "Console Error",
       }
      `)
    }
  })
})
