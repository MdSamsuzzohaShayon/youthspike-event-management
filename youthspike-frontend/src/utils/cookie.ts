import { IAccessCode } from '@/types';
import { ACCESS_CODE } from './constant';
import {
  getCookie,
  setCookie,
  removeCookie,
  getUserFromCookie,
} from './clientCookie';

/**
 * The cookie helpers live in `clientCookie.ts` so that every module of the app
 * reads and writes cookies with exactly the same rules (domain, path, encoding).
 * They are re-exported here to keep the existing import paths working.
 */

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
  } else {
    accessCodeData = [newAccessCode];
  }

  setCookie(ACCESS_CODE, JSON.stringify(accessCodeData), 7);
}

export { getCookie, setCookie, removeCookie, getUserFromCookie, setAccessCode };
