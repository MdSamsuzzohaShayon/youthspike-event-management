import { IAccessCode, IUserContext } from '@/types';
import { FRONTEND_URL, NODE_ENV } from './keys';
import { ACCESS_CODE } from './constant';

// Function to get a specific cookie by name
function getCookie(cookieName: string) {
  // Split the cookies string into an array of individual cookies
  const cookies = document.cookie.split(';');

  // Iterate through the cookies to find the one with the specified name
  for (let i = 0; i < cookies.length; i += 1) {
    const cookie = cookies[i].trim();

    // Check if the current cookie starts with the desired name
    if (cookie.indexOf(`${cookieName}=`) === 0) {
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

  if (NODE_ENV === 'production') {
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
  if (NODE_ENV === 'production') {
    /**
     * Ensure we use the same domain pattern used during cookie creation
     * Use a leading dot (.) for subdomain-wide coverage
     */
    const allSubDomains = FRONTEND_URL.split('//')[1];
    document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; Max-Age=0; Domain=${allSubDomains}; path=/`;
  } else {
    // For non-production environments, just remove it without specifying Domain
    document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; Max-Age=0; path=/`;
  }
}

// ===== Logical functions =====
function getUserFromCookie(): IUserContext {
  const instantToken = getCookie('token'); // Fetch again
  const instantInfo = getCookie('user');
  return {
    info: instantInfo ? JSON.parse(instantInfo) : null,
    token: instantToken || null,
  };
}

function setAccessCode({ match, code }: IAccessCode) {
  const accessCodes = getCookie(ACCESS_CODE);
  const newAccessCode: IAccessCode = { match, code };
  let accessCodeData: IAccessCode[] = [];
  if (accessCodes) {
    accessCodeData = JSON.parse(accessCodes);
    const matchIndex = accessCodeData.findIndex((ac) => ac?.match === match);
    if (matchIndex != -1) {
      accessCodeData[matchIndex] = newAccessCode;
    } else {
      accessCodeData.push(newAccessCode);
    }
  }
  {
    accessCodeData = [newAccessCode];
  }

  setCookie(ACCESS_CODE, JSON.stringify(accessCodeData), 7);
}

export { getCookie, setCookie, removeCookie, getUserFromCookie, setAccessCode };