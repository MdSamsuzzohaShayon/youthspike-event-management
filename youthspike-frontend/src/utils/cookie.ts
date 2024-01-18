import { FRONTEND_URL, NODE_ENV } from "./keys";


// function getCookie(name: string): string | null {
//   const value = `; ${document.cookie}`;
//   const regex = new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*=\\s*([^;]*).*$)|^.*$`);
//   const match = value.match(regex);

//   if (match) {
//     const expectedCookie = match[1] || null;
//     return expectedCookie;
//   }

//   return null;
// }

// Function to get a specific cookie by name
function getCookie(cookieName: string) {
  // Split the cookies string into an array of individual cookies
  const cookies = document.cookie.split(';');

  // Iterate through the cookies to find the one with the specified name
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();

    // Check if the current cookie starts with the desired name
    if (cookie.indexOf(cookieName + '=') === 0) {
      // Extract and return the cookie value
      return cookie.substring(cookieName.length + 1);
    }
  }

  // Return null if the cookie is not found
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);

  if (NODE_ENV === "production") {
    /**
     * Domain=.aslsquads.com: This part sets the domain for which the cookie is valid. 
     * By specifying .aslsquads.com as the domain (note the leading dot), 
     * the cookie is accessible across all subdomains of aslsquads.com, including 
     */
    const allSubDomains = FRONTEND_URL.split('//')[1];
    document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()}; Domain=${allSubDomains}; path=/`;
  } else {
    document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()};  path=/`;
  }
}

function removeCookie(name: string): void {
  document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; Max-Age=0; path=/;`;
}

export { getCookie, setCookie, removeCookie };
