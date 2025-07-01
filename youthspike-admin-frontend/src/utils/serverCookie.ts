// lib/server/cookies.ts
'use server';

import { cookies } from 'next/headers';
import { IUserContext } from "@/types";
import { FRONTEND_URL, NODE_ENV } from "./keys";
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

/*
export async function getCookie(name: string): Promise<string | null> {
  return cookies().get(name)?.value ?? null;
}

export async function setCookie(
  name: string, 
  value: string, 
  days?: number
): Promise<void> {
  cookies().set({
    name,
    value,
    expires: days ? Date.now() + days * 24 * 60 * 60 * 1000 : undefined,
    path: '/',
    domain: NODE_ENV === "production" ? FRONTEND_URL.split('//')[1] : undefined,
    secure: NODE_ENV === "production",
    httpOnly: true,
  });
}

export async function removeCookie(name: string): Promise<void> {
  cookies().delete(name);
}
  */

export async function getUserFromCookie(cookieStore: ReadonlyRequestCookies): Promise<IUserContext | null> {
  const user = cookieStore.get('user')?.value;
  const token = cookieStore.get('token')?.value;

  const userContext: IUserContext = {
    info: user ? JSON.parse(user) : null,
    token: token ? token : null,
  };

  return user || token ? userContext : null;

}