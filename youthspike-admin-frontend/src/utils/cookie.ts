import { ADMIN_URL, FRONTEND_URL, NODE_ENV } from "./keys";

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const regex = new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*=\\s*([^;]*).*$)|^.*$`);
  const match = value.match(regex);

  if (match) {
    const expectedCookie = match[1] || null;
    return expectedCookie;
  }

  return null;
}

function setCookie(name: string, value: string, days: number): void {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);

  if (NODE_ENV === "production"){
    const allSubDomains = FRONTEND_URL.split('//')[1];
    document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()}; Domain=${allSubDomains}; path=/`;
  }else{
    document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()};  path=/`;
  }
}

function removeCookie(name: string ): void {
  // Set the expiration date in the past to delete the cookie
  const expiredDate = new Date(0);

  if (NODE_ENV === "production") {
    const allSubDomains = FRONTEND_URL.split('//')[1];
    document.cookie = `${name}=; expires=${expiredDate.toUTCString()}; Domain=${allSubDomains}; path=/`;
  } else {
    document.cookie = `${name}=; expires=${expiredDate.toUTCString()}; path=/`;
  }
}

export { getCookie, setCookie, removeCookie };
