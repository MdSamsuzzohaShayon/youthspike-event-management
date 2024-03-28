import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  _id: string;
  // Add other properties if necessary
}

export function rmInvalidProps(prevObj: Record<string, any>): Record<string, any> {
  const clonedObj: Record<string, any> = { ...prevObj };
  const newObj: Record<string, any> = {};

  for (const [key, value] of Object.entries(clonedObj)) {
    if (value !== null && value !== undefined && value !== '') {
      newObj[key] = value;
    }
  }

  return newObj;
}

export function tokenToUser(context, secret: string): string | null {
  const authToken = context.req.headers.authorization;
  if(!authToken) return null;
  const token = authToken.split(' ');
  let user: JwtPayload | null = null;
  const baseToken = token[1];
  if (baseToken) {
    user = jwt.verify(baseToken, secret) as JwtPayload | null;
  }
  if (!user || !user._id) return null;
  const userId = user._id;
  return userId;
}
