import rule from '@next/eslint-plugin-next/lib/rules/no-unwanted-polyfillio'
import { RuleTester } from 'eslint'
;(RuleTester as any).setDefaultConfig({
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
      jsx: true,
    },
  },
})
const ruleTester = new RuleTester()

ruleTester.run('unwanted-polyfillsio', rule, {
  valid: [
    `import {Head} from 'next/document';

      export class Blah extends Head {
        render() {
          return (
            <div>
              <h1>Hello title</h1>
              <script src='https://polyfill.io/v3/polyfill.min.js?features=AbortController'></script>
            </div>
          );
        }
    }`,
    `import {Head} from 'next/document';

      export class Blah extends Head {
        render() {
          return (
            <div>
              <h1>Hello title</h1>
              <script src='https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver'></script>
            </div>
          );
        }
    }`,
    `import Script from 'next/script';

      export function MyApp({ Component, pageProps }) {
          return (
            <div>
              <Component {...pageProps} />
              <Script src='https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver' />
            </div>
          );
    }`,
  ],

  invalid: [
    {
      code: `import {Head} from 'next/document';

      export class Blah extends Head {
        render() {
          return (
            <div>
              <h1>Hello title</h1>
              <script src='https://polyfill.io/v3/polyfill.min.js?features=WeakSet%2CPromise%2CPromise.prototype.finally%2Ces2015%2Ces5%2Ces6'></script>
            </div>
          );
        }
    }`,
      errors: [
        {
          message:
            'No duplicate polyfills from Polyfill.io are allowed. WeakSet, Promise, Promise.prototype.finally, es2015, es5, es6 are already shipped with Next.js. See: https://nextjs.org/docs/messages/no-unwanted-polyfillio',
          type: 'JSXOpeningElement',
        },
      ],
    },
    {
      code: `
      export class Blah {
        render() {
          return (
            <div>
              <h1>Hello title</h1>
              <script src='https://polyfill.io/v3/polyfill.min.js?features=Array.prototype.copyWithin'></script>
            </div>
          );
        }
    }`,
      errors: [
        {
          message:
            'No duplicate polyfills from Polyfill.io are allowed. Array.prototype.copyWithin is already shipped with Next.js. See: https://nextjs.org/docs/messages/no-unwanted-polyfillio',
          type: 'JSXOpeningElement',
        },
      ],
    },
    {
      code: `import NextScript from 'next/script';

      export function MyApp({ Component, pageProps }) {
          return (
            <div>
              <Component {...pageProps} />
              <NextScript src='https://polyfill.io/v3/polyfill.min.js?features=Array.prototype.copyWithin' />
            </div>
          );
    }`,
      errors: [
        {
          message:
            'No duplicate polyfills from Polyfill.io are allowed. Array.prototype.copyWithin is already shipped with Next.js. See: https://nextjs.org/docs/messages/no-unwanted-polyfillio',
          type: 'JSXOpeningElement',
        },
      ],
    },
  ],
})
