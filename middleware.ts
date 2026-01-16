/**
 * Edge-compatible Middleware for Route Protection
 * 
 * This middleware runs on the edge and protects routes by verifying
 * JWT session tokens. It does NOT use Prisma (which isn't edge-compatible).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if route is public
  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)

  // Get session token from cookie
  const sessionToken = request.cookies.get('session')?.value

  // Verify token if present
  let isAuthenticated = false
  
  if (sessionToken) {
    try {
      const secretKey = new TextEncoder().encode(
        process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
      )
      await jwtVerify(sessionToken, secretKey)
      isAuthenticated = true
    } catch {
      // Token is invalid or expired
      isAuthenticated = false
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login (for protected routes)
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
