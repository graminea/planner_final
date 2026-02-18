/**
 * Route Protection Proxy (Next.js 16+)
 * 
 * Runs on the edge to protect routes by verifying JWT session tokens.
 * Does NOT use Prisma (which isn't edge-compatible).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/register']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register']

export async function proxy(request: NextRequest) {
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
      const secret = process.env.JWT_SECRET
      if (!secret || secret.length < 32) {
        console.error('JWT_SECRET missing or too short in middleware')
        // Clear invalid session cookie to prevent loops and continue
        if (!isPublicRoute) {
          const response = NextResponse.redirect(new URL('/login', request.url))
          response.cookies.delete('session')
          return response
        }
        isAuthenticated = false
      } else {
        const secretKey = new TextEncoder().encode(secret)
        await jwtVerify(sessionToken, secretKey)
        isAuthenticated = true
      }
    } catch (error) {
      // Token is invalid or expired - clear the cookie
      console.error('JWT verification failed:', error)
      isAuthenticated = false
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login (for protected routes)
  if (!isAuthenticated && !isPublicRoute) {
    // Prevent redirect loops - if already going to login, just continue
    if (pathname === '/login') {
      return NextResponse.next()
    }
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
