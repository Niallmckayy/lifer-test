import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const isAdminRoute    = nextUrl.pathname.startsWith('/dashboard/admin')
  const isCustomerRoute = nextUrl.pathname.startsWith('/dashboard/customer')
  const isAuthRoute     = nextUrl.pathname.startsWith('/login')
  const isSiteRoute     = nextUrl.pathname.startsWith('/sites')

  // Public routes — always allowed
  if (isSiteRoute || nextUrl.pathname === '/') return NextResponse.next()

  // Already logged in — redirect away from login
  if (isAuthRoute && isLoggedIn) {
    const role = (session?.user as { role?: string })?.role
    return NextResponse.redirect(
      new URL(role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/customer', nextUrl),
    )
  }

  // Not logged in — redirect to login
  if ((isAdminRoute || isCustomerRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Wrong role
  if (isAdminRoute && (session?.user as { role?: string })?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard/customer', nextUrl))
  }

  if (isCustomerRoute && (session?.user as { role?: string })?.role !== 'CUSTOMER') {
    return NextResponse.redirect(new URL('/dashboard/admin', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
