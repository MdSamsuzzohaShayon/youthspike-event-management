/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const unauthenticatedPages = ['/login', '/signup', '/userSignup'];
const authenticatedPages = ['/','/players', '/matches', "/settings", "/teams"];

// Update
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    // '/((?!api|_next/static|_next/image|favicon.ico).*)',
    "/((?!api|static|.*\\..*|_next).*)",
  ],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('token');
  const user = request.cookies.get('user');

  console.log({ pathname, token: token?.value, user: user && user.value !== '' ? JSON.parse(user.value) : null });

  // If both did not match
  // if( !unauthenticatedPages.some((prefix) => pathname.startsWith(prefix)) && authenticatedPages.some((prefix) => pathname.startsWith(prefix))){
  //   return;
  // }


  if (unauthenticatedPages.some((prefix) => pathname.startsWith(prefix))) {
    console.log('Unauthenticated page match ');
    if (!token || token.value === '' || !user || user.value === '') return NextResponse.next();
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (authenticatedPages.some((prefix) => pathname.startsWith(prefix))) {
    console.log('Authenticated page match ', token?.value);
    if (token && token.value !== '') return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
