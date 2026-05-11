// src/app/api/logout/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete('user');
  cookieStore.delete('token');
  cookieStore.delete('NEXT_PUBLIC_CURRENT_EVENT_ID');

  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${baseUrl}/login`); // ✅ Absolute URL
}
