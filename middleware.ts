import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const url = request.nextUrl.clone()
  
  // Detect device type
  const isMobile = /iPhone|Android|webOS|BlackBerry|Windows Phone/i.test(userAgent)
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent)
  
  // Skip if already on a platform-specific path
  if (url.pathname.startsWith('/mobile') || 
      url.pathname.startsWith('/tablet') || 
      url.pathname.startsWith('/desktop')) {
    return NextResponse.next()
  }
  
  // Redirect to appropriate version
  if (isMobile && !url.pathname.startsWith('/mobile')) {
    // Redirect to mobile version (deployed separately)
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_MOBILE_URL || 'https://aksuite-mobile.vercel.app', request.url))
  }
  
  if (isTablet && !url.pathname.startsWith('/tablet')) {
    // Redirect to tablet version (deployed separately)
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_TABLET_URL || 'https://aksuite-tablet.vercel.app', request.url))
  }
  
  // Desktop (default)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
