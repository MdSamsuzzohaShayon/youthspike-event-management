/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from './types/user';

// Define arrays for unauthenticated, authenticated, and admin pages
const unauthenticatedPages = ['/login', '/signup', '/userSignup'];
const authenticatedPages = ['/', '/players', '/matches', "/settings", "/teams"];
const adminPages = ['/admin'];

/**
 * Configuration for the Next.js middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|static|.*\\..*|_next).*)",
  ],
};

/**
 * Middleware function for handling authentication and authorization
 * @param request - Next.js request object
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token and user information from cookies
  const token = request.cookies.get('token');
  const user = request.cookies.get('user');

  console.log({ pathname, token: token?.value, user: user && user.value !== '' ? JSON.parse(user.value) : null });

  /**
   * Unauthenticated pages can not access authenticated or admin content
   */
  if (!token || !token.value || token.value === '' || !user || !user.value || user.value === '') {
    console.log('Unauthenticated page match ');

    // Redirect to login page if the requested page requires authentication or admin access
    if ([...authenticatedPages, ...adminPages].some(page => new RegExp(`${pathname}\\/?`, 'gi').test(page))) {
      return NextResponse.redirect(new URL('/login', request.url));
    } else {
      return NextResponse.next(); // Continue to the requested page if no authentication is required
    }
  }

  // Authenticated user can not visit login or register page
  const isUnauthenticatedPage = unauthenticatedPages.includes(pathname) || unauthenticatedPages.some(page => new RegExp(`^${page}/?$`, 'i').test(pathname));
  if (isUnauthenticatedPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Get user object from the user cookie
  const userObj = user?.value && user.value !== '' ? JSON.parse(user.value) : null;

  // Handle access to authenticated pages
  const isAuthenticatedPage = authenticatedPages.includes(pathname) || authenticatedPages.some(page => new RegExp(`^${page}/?$`, 'i').test(pathname));
  if (isAuthenticatedPage) {
    // Redirect if the user is not a director
    if (userObj && userObj.role === UserRole.director) return NextResponse.next();
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  // Handle access to admin pages
  const isAdminPage = adminPages.includes(pathname) || adminPages.some(page => new RegExp(`^${page}/?$`, 'i').test(pathname));
  if (isAdminPage) {
    console.log('Admin page match ');

    // Redirect if the user is not an admin
    if (userObj && userObj.role === UserRole.admin) return NextResponse.next();
    return NextResponse.redirect(new URL('/', request.url));
  }
}