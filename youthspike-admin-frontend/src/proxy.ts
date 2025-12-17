import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole } from './types/user'

// Role-based page definitions
const unauthenticatedPages = ['/login', '/signup', '/userSignup'];
const directorAuthPages = ['/', '/players', '/matches', '/settings', '/teams', '/new', '/account', '/newevent', '/teamstandings'];
const capCoPlayerPages = ['/players', '/matches', '/settings', '/teamstandings'];
const adminPages = ['/', '/admin', '/directors', '/settings', '/teamstandings'];

// Configuration for the proxy
export const config = {
  matcher: [
    "/((?!api|static|.*\\..*|_next).*)",
  ],
};

// Authentication check helper
function checkAuthentication(request: NextRequest) {
  const token = request.cookies.get('token');
  const user = request.cookies.get('user');
  
  if (!token?.value || !user?.value) {
    return { authenticated: false, userObj: null };
  }
  
  try {
    const userObj = JSON.parse(user.value);
    return { authenticated: true, userObj };
  } catch (error) {
    return { authenticated: false, userObj: null };
  }
}

// Path matching helper
function matchesPath(pathname: string, pageList: string[]) {
  return pageList.some(page => new RegExp(`${page}/?$`, 'i').test(pathname));
}

// Authentication logic from your middleware
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { authenticated, userObj } = checkAuthentication(request);
  
  console.log({ pathname, authenticated, user: userObj });
  
  // Handle unauthenticated users
  if (!authenticated) {
    const protectedPages = [...new Set([...directorAuthPages, ...capCoPlayerPages, ...adminPages])];
    const redirectPageUrl = '/login';
    
    let isProtected = false;
    for (const page of protectedPages) {
      if (pathname.includes(page) && pathname !== redirectPageUrl) {
        isProtected = true;
        break;
      }
    }
    
    if (isProtected) {
      const response = NextResponse.redirect(new URL(redirectPageUrl, request.url));
      return response;
    }
    
    return NextResponse.next();
  }
  
  // Handle authenticated users trying to access unauthenticated pages
  if (matchesPath(pathname, unauthenticatedPages)) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Handle role-based access control
  if (userObj?.role === UserRole.admin) {
    // Admin access logic
    if (matchesPath(pathname, adminPages)) {
      return NextResponse.next();
    }
  } else if (userObj?.role === UserRole.director) {
    // Director access logic
    if (matchesPath(pathname, directorAuthPages)) {
      return NextResponse.next();
    }
  } else if ([UserRole.captain, UserRole.co_captain, UserRole.player].includes(userObj?.role)) {
    // Captain/Co-captain/Player access logic
    if (matchesPath(pathname, capCoPlayerPages)) {
      return NextResponse.next();
    }
    
    // Redirect players with event to their event page
    if (userObj.event) {
      return NextResponse.redirect(new URL(`/${userObj.event}/players`, request.url));
    }
  }
  
  // Default: redirect to not found for unauthorized access
  return NextResponse.redirect(new URL('/not-found', request.url));
}