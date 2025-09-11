import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from './types/user';

const unauthenticatedPages = ['/login', '/signup', '/userSignup'];
const directorAuthPages = ['/', '/players', '/matches', '/settings', '/teams', '/new', '/account', '/newevent', '/teamstandings'];
const capCoPlayerPages = ['/players', '/matches', '/settings', '/teamstandings']; // Player
const adminPages = ['/', '/admin', '/directors', '/settings', '/teamstandings'];

export const config = {
  matcher: [
    "/((?!api|static|.*\\..*|_next).*)",
  ],
};


function handleUnauthenticated(request: NextRequest, pathname: string) {
  const protectedPages = [...new Set([...directorAuthPages, ...capCoPlayerPages, ...adminPages])];
  
  

  // if (protectedPages.some(page => new RegExp(`${page}(\\/?$)`, 'i').test(pathname))) {
  //   return NextResponse.redirect(new URL('/login', request.url).toString());
  // }


  // if (protectedPages.some(page => new RegExp(`(?:^|\\/|\\/)${page}(?:\\/|$)`, 'i').test(pathname))) {
  //   return NextResponse.redirect(new URL('/login', request.url).toString());
  // }

  const redirectPageUrl = '/login';

  let isMatch = false;
  for(const page of protectedPages){
    if(pathname.includes(page) && pathname !== redirectPageUrl) isMatch = true;
  }
  if(isMatch){
    return NextResponse.redirect(new URL(redirectPageUrl, request.url).toString());
  }

  /**
   *    (?:^|\\/|\\/) matches the start of the string or a / before the page.
   *    ${page} matches the specific page pattern.
   *    (?:\\/|$) matches the end of the string or a / after the page.
   */

  return NextResponse.next();
}

function isUnauthenticatedPage(pathname: string) {
  return unauthenticatedPages.includes(pathname) || unauthenticatedPages.some(page => new RegExp(`${page}/?$`, 'i').test(pathname));
}

function handleUnauthenticatedPage(request: NextRequest) {
  return NextResponse.redirect(new URL('/', request.url).toString());
}

function isAuthenticatedPage(pathname: string, userObj: any) {
  const authorizedPages = [...directorAuthPages, ...capCoPlayerPages];

  return authorizedPages.some(page => new RegExp(`${page}/?$`, 'i').test(pathname)) && userObj?.role !== UserRole.admin;
}

function handleAuthenticatedPage(request: NextRequest, pathname: string, userObj: any) {
  if (userObj?.role === UserRole.director && directorAuthPages.some(page => new RegExp(`${page}/?$`, 'i').test(pathname))) {
    return NextResponse.next();
  } else if ((userObj?.role === UserRole.captain || userObj?.role === UserRole.co_captain || userObj?.role === UserRole.player) && capCoPlayerPages.some(page => new RegExp(`${page}/?$`, 'i').test(pathname))) {
    return NextResponse.next();
  } else if ((userObj?.role === UserRole.captain || userObj?.role === UserRole.co_captain || userObj?.role === UserRole.player) && userObj.event) {
    return NextResponse.redirect(new URL(`/${userObj.event}/players`, request.url).toString());
  }

  return NextResponse.redirect(new URL('/not-found/404', request.url).toString());
}

function isAdminPage(pathname: string, userObj: any) {
  return adminPages.includes(pathname) || adminPages.some(page => new RegExp(`${page}/?$`, 'i').test(pathname));
}

function handleAdminPage(request: NextRequest, userObj: any) {
  if (userObj?.role === UserRole.admin) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', request.url).toString());
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token');
  const user = request.cookies.get('user');

  console.log({ pathname, token: token?.value, user: user?.value ? JSON.parse(user.value) : null });

  if (!token?.value || !user?.value) {
    return handleUnauthenticated(request, pathname);
  }

  const userObj = user?.value ? JSON.parse(user.value) : null;

  if (isUnauthenticatedPage(pathname)) {
    return handleUnauthenticatedPage(request);
  }

  if (isAuthenticatedPage(pathname, userObj)) {
    return handleAuthenticatedPage(request, pathname, userObj);
  }

  if (isAdminPage(pathname, userObj)) {
    return handleAdminPage(request, userObj);
  }

  return NextResponse.next();
}


