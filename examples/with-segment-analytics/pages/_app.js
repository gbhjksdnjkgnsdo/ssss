import Page from '../components/Page'
import Script from 'next/script'
import * as snippet from '@segment/snippet'

function renderSnippet() {
  const opts = {
    apiKey:
      process.env.NEXT_PUBLIC_ANALYTICS_WRITE_KEY ||
      'NPsk1GimHq09s7egCUlv7D0tqtUAU5wa',
    // note: the page option only covers SSR tracking.
    // Page.js is used to track other events using `window.analytics.page()`
    page: true,
  }

  if (process.env.NEXT_PUBLIC_NODE_ENV === 'development') {
    return snippet.max(opts)
  }

  return snippet.min(opts)
}

function MyApp({ Component, pageProps }) {
  return (
    <Page>
      {/* Inject the Segment snippet into the <head> of the document  */}
      <Script dangerouslySetInnerHTML={{ __html: renderSnippet() }} />
      <Component {...pageProps} />
    </Page>
  )
}

export default MyApp
