/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { IUser, UserRole } from './types/user';
import { NODE_ENV } from './utils/keys';
import { EEnv } from './types';

// Define arrays for unauthenticated, authenticated, and admin pages
const unauthenticatedPages = ['/login', '/signup', '/userSignup'];
const directorAuthPages = ['/', '/players', '/matches', '/settings', '/teams', '/new'];
const captainAuthPages = ['/players', '/matches', '/settings'];
const adminPages = ['/admin', '/directors'];

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
    '/((?!api|static|.*\\..*|_next).*)',
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


  // https://aslsquads.com/events/68afc5f30bf9dbb4ac0f69cb
  if(pathname === "/"){
    if (token && token.value && token.value !== '' && user && user.value){
      const userObj: IUser = JSON.parse(user.value);
      if(userObj.role === UserRole.admin){
        return NextResponse.next();
      }
    }
    return NextResponse.redirect(new URL(`/events/${process.env.NEXT_PUBLIC_CURRENT_EVENT_ID}/matches`, request.url));
    // Recover commit: 014cb44e23a6bafda3736876073f7e5046e8664a
  }

}











