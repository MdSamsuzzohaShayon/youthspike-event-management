import * as jwt from 'jsonwebtoken';

export function makeAuthToken(payload: Record<string, any>, secret = 'test-jwt-secret'): string {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

export function directorToken(directorId: string) {
  return makeAuthToken({ _id: directorId, role: 'director' });
}

export function adminToken(adminId: string) {
  return makeAuthToken({ _id: adminId, role: 'admin' });
}