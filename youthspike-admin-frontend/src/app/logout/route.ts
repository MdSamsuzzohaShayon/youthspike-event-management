// https://nextjs.org/docs/app/api-reference/file-conventions/route

// /logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  return handleLogout();
}

// export async function POST() {
//   return handleLogout();
// }

function handleLogout() {
  // Delete cookies
  cookies().delete('user');
  cookies().delete('token');

  // Return response with redirect
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_FRONTEND_URL), {
    status: 302,
    headers: {
      // Optionally set other headers
      'Set-Cookie': `user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${process.env.NODE_ENV === 'production' ? 'Secure; HttpOnly; SameSite=Strict' : ''}`
    }
  });
}