import { createNext } from 'e2e-utils'
import { NextInstance } from 'test/lib/next-modes/base'
import webdriver from 'next-webdriver'

describe('Dotenv default expansion', () => {
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: {
        'pages/index.js': `
          export default function Page() { 
            return <p>{process.env.NEXT_PUBLIC_TEST}</p>
          } 
        `,
        '.env': `
          NEXT_PUBLIC_TEST=\${MISSING_KEY:-default}
        `,
      },
      dependencies: {},
    })
  })
  afterAll(() => next.destroy())

  it('should work', async () => {
    const browser = await webdriver(next.appPort, '/')
    const text = await browser.elementByCss('p').text()
    expect(text).toBe('default')

    await browser.close()
  })
})
