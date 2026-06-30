import { NextRequest, NextResponse } from "next/server";
import { IUser, UserRole } from "./types/user";
import { CURRENT_EVENT_ID } from "./utils/constant";

export const config = {
  matcher: ["/((?!api|static|.*\\..*|_next).*)"],
};

/**
 * Creates a redirect URL and automatically adds the `cei`
 * query parameter if it doesn't already exist.
 */
function createRedirect(
  request: NextRequest,
  pathname: string,
  currentEventId: string
) {
  const url = request.nextUrl.clone();

  url.pathname = pathname;

  // Preserve existing query params and only add cei if missing.
  if (!url.searchParams.has(CURRENT_EVENT_ID)) {
    url.searchParams.set(CURRENT_EVENT_ID, currentEventId);
  }

  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const { pathname } = nextUrl;

  const token = cookies.get("token")?.value;
  const userCookie = cookies.get("user")?.value;
  const currentEventId =
    cookies.get(CURRENT_EVENT_ID)?.value ?? null;

  /**
   * Nothing to do if there is no current event.
   */
  if (!currentEventId) {
    return NextResponse.next();
  }

  /**
   * Redirect:
   * / -> /events/:id/matches?cei=:id
   *
   * Admins are allowed to stay on "/".
   */
  if (pathname === "/") {
    if (token && userCookie) {
      try {
        const user: IUser = JSON.parse(userCookie);

        if (user.role === UserRole.admin) {
          return NextResponse.next();
        }
      } catch (error){
        console.error(error);
        
        // Ignore invalid cookie and continue redirect.
      }
    }

    return createRedirect(
      request,
      `/events/${currentEventId}/matches`,
      currentEventId
    );
  }

  /**
   * Redirect:
   * /events/:id -> /events/:id/matches?cei=:id
   */
  if (pathname === `/events/${currentEventId}`) {
    return createRedirect(
      request,
      `/events/${currentEventId}/matches`,
      currentEventId
    );
  }

  /**
   * For every other request, ensure `cei` exists.
   * Existing values are preserved.
   */
  if (!nextUrl.searchParams.has(CURRENT_EVENT_ID)) {
    const url = nextUrl.clone();
    url.searchParams.set(CURRENT_EVENT_ID, currentEventId);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}