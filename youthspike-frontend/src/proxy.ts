import { NextRequest, NextResponse } from "next/server";
import { IUser, UserRole } from "./types/user";

/**
 * Proxy configuration
 * Matches all routes except:
 * - api
 * - static files
 * - _next internals
 * - files with extensions
 */
export const config = {
  matcher: [
    "/((?!api|static|.*\\..*|_next).*)",
  ],
};

/**
 * Proxy function
 * Runs before request completion and can redirect/rewrite responses
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read cookies
  const token = request.cookies.get("token");
  const user = request.cookies.get("user");

  // const currentEventId = process.env.NEXT_PUBLIC_CURRENT_EVENT_ID;
  const currentEventId = request.cookies.get("NEXT_PUBLIC_CURRENT_EVENT_ID")?.value || null;
  

  /**
   * Root route handling (/)
   */
  if (pathname === "/") {
    if (token?.value && user?.value) {
      try {
        const userObj: IUser = JSON.parse(user.value);

        // Allow admins to access root without redirect
        if (userObj.role === UserRole.admin) {
          return NextResponse.next();
        }
      } catch {
        // Invalid cookie JSON → fallback redirect
      }
    }

    return NextResponse.redirect(
      new URL(`/events/${currentEventId}/matches`, request.url)
    );
  }

  /**
   * Redirect /events/:id → /events/:id/matches
   */
  if (pathname === `/events/${currentEventId}`) {
    return NextResponse.redirect(
      new URL(`/events/${currentEventId}/matches`, request.url)
    );
  }

  // Default: allow request to continue
  return NextResponse.next();
}
