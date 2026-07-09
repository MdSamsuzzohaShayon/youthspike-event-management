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
  // const currentEventId =
  //   cookies.get(CURRENT_EVENT_ID)?.value ?? null;

  const currentEventId = "6a3c355236b002d89afc4a49";

  // Set default queryParams division to "p1-pro*"
  const shouldSetDefaultDivision =
    pathname.includes('/teams') ||
    pathname.includes('/matches') ||
    pathname.includes('/players');

  /**
   * Nothing to do if there is no current event.
   */
  if (!currentEventId) {
    // Still set default division if applicable
    if (shouldSetDefaultDivision && !nextUrl.searchParams.has('division')) {
      const url = nextUrl.clone();
      url.searchParams.set('division', 'p1-pro*');
      return NextResponse.redirect(url);
    }
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

        // if (user.role === UserRole.admin) {
        //   return NextResponse.next();
        // }
      } catch (error) {
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
  let needsRedirect = false;
  const url = nextUrl.clone();

  if (!nextUrl.searchParams.has(CURRENT_EVENT_ID)) {
    url.searchParams.set(CURRENT_EVENT_ID, currentEventId);
    needsRedirect = true;
  }

  // Set default division if on relevant pages and no division param exists
  if (shouldSetDefaultDivision && !nextUrl.searchParams.has('division')) {
    url.searchParams.set('division', 'p1-pro*');
    needsRedirect = true;
  }

  if (needsRedirect) {
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}