import { NextResponse } from 'next/server'

export async function middleware(request) {
  const url = request.nextUrl

  if (url.pathname.startsWith('/rewrites/to-blog')) {
    const slug = url.pathname.split('/').pop()
    console.log('rewriting to slug', slug)
    return NextResponse.rewrite(`/rewrites/fallback-true-blog/${slug}`)
  }

  if (url.pathname === '/rewrites/rewrite-to-ab-test') {
    let bucket = request.cookies.bucket
    if (!bucket) {
      bucket = Math.random() >= 0.5 ? 'a' : 'b'
      const response = NextResponse.rewrite(`/rewrites/${bucket}`)
      response.cookie('bucket', bucket, { maxAge: 10000 })
      return response
    }

    return NextResponse.rewrite(`/rewrites/${bucket}`)
  }

  if (url.pathname === '/rewrites/rewrite-me-to-about') {
    return NextResponse.rewrite('/rewrites/about')
  }

  if (url.pathname === '/rewrites/rewrite-me-with-a-colon') {
    return NextResponse.rewrite('/rewrites/with:colon')
  }

  if (url.pathname === '/rewrites/colon:here') {
    return NextResponse.rewrite('/rewrites/no-colon-here')
  }

  if (url.pathname === '/rewrites/rewrite-me-to-vercel') {
    return NextResponse.rewrite('https://vercel.com')
  }

  if (url.pathname === '/rewrites/rewrite-me-without-hard-navigation') {
    url.pathname = '/rewrites/about'
    url.searchParams.set('middleware', 'foo')
    return NextResponse.rewrite(url)
  }
}
