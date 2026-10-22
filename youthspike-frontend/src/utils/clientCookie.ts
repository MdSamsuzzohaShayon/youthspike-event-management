// lib/client/cookies.ts
'use client';

import { IUserContext } from "@/types";
import { FRONTEND_URL, NODE_ENV } from "./keys";

/**
 * The admin app (admin.aslsquads.com) and the public app (aslsquads.com) have to
 * share the same auth cookie, so in production the cookie is scoped to the
 * registrable domain of FRONTEND_URL.
 *
 * The browser enforces two rules silently - there is no error, the cookie is just
 * dropped and can never be read back:
 *  1. `Domain` must never contain a port, `Domain=localhost:3001` is invalid.
 *  2. `Domain` must domain-match the host of the page that writes the cookie.
 */
export function getCookieDomain(): string | undefined {
  // In development the app runs on different ports (3000/3001), a host only
  // cookie is the only thing that works there.
  if (NODE_ENV !== "production") return undefined;

  let hostname: string;
  try {
    // `hostname` never contains the port, `host` does.
    hostname = new URL(FRONTEND_URL).hostname;
  } catch {
    return undefined;
  }

  // "www.example.com" -> "example.com" so that both apps share the cookie.
  hostname = hostname.replace(/^www\./i, "");
  if (!hostname) return undefined;

  const currentHost = window.location.hostname;
  const domainMatches =
    currentHost === hostname || currentHost.endsWith(`.${hostname}`);

  // The current host is not part of that domain, a scoped cookie would be
  // invisible for this page - fall back to a host only cookie.
  return domainMatches ? hostname : undefined;
}

/**
 * Builds the attribute part of a cookie string.
 *
 * `setCookie` and `removeCookie` must always produce the exact same
 * `path`/`domain` attributes, otherwise the browser keeps the old cookie around
 * and it can never be removed.
 */
function buildCookieAttributes(expires?: Date): string {
  const attributes = ["path=/"];

  const domain = getCookieDomain();
  if (domain) attributes.push(`Domain=${domain}`);

  // `Secure` cookies are rejected on plain http origins, only add it when the
  // page is actually served over https.
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attributes.push("Secure");
  }

  attributes.push("SameSite=Lax");

  if (expires) attributes.push(`expires=${expires.toUTCString()}`);

  return attributes.join("; ");
}

/**
 * Reads a cookie by name.
 *
 * Returns `null` when the cookie does not exist - never `undefined`, so callers
 * can rely on the `string | null` contract.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie ? document.cookie.split(';') : [];

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex === -1) continue;

    if (cookie.slice(0, separatorIndex).trim() !== name) continue;

    const rawValue = cookie.slice(separatorIndex + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      // Not a percent encoded value, return it as is.
      return rawValue;
    }
  }

  return null;
}

export function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);

  document.cookie = `${name}=${encodeURIComponent(value)}; ${buildCookieAttributes(expirationDate)}`;
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;

  const expiredDate = new Date(0);

  document.cookie = `${name}=; ${buildCookieAttributes(expiredDate)}; Max-Age=0`;
}

export function getUserFromCookie(): IUserContext {
  const instantToken = getCookie('token');
  const instantInfo = getCookie('user');

  let info: IUserContext['info'] = null;
  if (instantInfo) {
    try {
      info = JSON.parse(instantInfo);
    } catch {
      // A corrupted cookie must not break the whole app.
      info = null;
    }
  }

  return {
    info,
    token: instantToken ? instantToken : null
  };
}
