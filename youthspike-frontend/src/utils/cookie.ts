function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const popedPart = parts.pop();
    if (!popedPart) return null;
    const expectedCookie = popedPart.split(";").shift();
    if (!expectedCookie) return null;
    return expectedCookie;
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);

  document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()}; path=/;`;
}

function removeCookie(name: string): void {
  document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; Max-Age=0; path=/;`;
}

export { getCookie, setCookie, removeCookie };
