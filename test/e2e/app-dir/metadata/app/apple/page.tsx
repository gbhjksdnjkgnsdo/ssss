import type { Metadata } from 'next'

export default function page() {
  return 'apple'
}

export async function generateMetadata(): Promise<Metadata> {
  const metadata = {
    itunes: {
      appId: 'myAppStoreID',
      appArgument: 'myAppArgument',
    },
    appleWebApp: {
      title: 'Apple Web App',
      statusBarStyle: 'black-translucent',
      startupImage: [
        '/assets/startup/apple-touch-startup-image-768x1004.png',
        {
          url: '/assets/startup/apple-touch-startup-image-1536x2008.png',
          media: '(device-width: 768px) and (device-height: 1024px)',
        },
      ],
    },
  }
  return metadata
}
