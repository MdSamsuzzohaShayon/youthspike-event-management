import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  _id: string;
  // Add other properties if necessary
  passcode: string | null;
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

export function tokenToUser(context, secret: string): JwtPayload | null {
  const authToken = context.req.headers.authorization;
  if (!authToken) return null;
  const token = authToken.split(' ');
  let user: JwtPayload | null = null;
  const baseToken = token[1];
  if (baseToken) {
    user = jwt.verify(baseToken, secret) as JwtPayload | null;
  }
  if (!user || !user._id) return null;
  return user;
}

export function checkDateHasPassed(isoDate: string): boolean {
  // Check if the date is a valid ISO date
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(isoDate)) {
    return false; // Invalid ISO date
  }

  try {
    // Parse the date
    const parsedDate = new Date(isoDate);

    // Ensure the parsed date is valid
    if (isNaN(parsedDate.getTime())) {
      return false; // Invalid date
    }

    // Compare the date with the current date
    return parsedDate < new Date(); // True if the date has passed
  } catch (error) {
    return false; // Handle any unexpected errors
  }
}

export function isISODateString(dateString) {
  // Check if it's a string and matches the ISO 8601 format
  const isoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[\+\-]\d{2}:\d{2})?$/;
  if (typeof dateString !== 'string' || !isoFormat.test(dateString)) {
    return false;
  }

  // Attempt to parse it as a Date and check if it's valid
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long', // Literal type: 'long', 'short', or 'narrow'
    year: 'numeric', // Literal type: 'numeric' or '2-digit'
    month: 'long', // Literal type: 'long', 'short', 'narrow', 'numeric', or '2-digit'
    day: '2-digit', // Literal type: 'numeric' or '2-digit'
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}


export function initPlayerStat(net: string, match: string, player: string){
  return {
    serveOpportunity: 0,
    serveAce: 0,
    serveCompletionCount: 0,
    servingAceNoTouch: 0,
    receiverOpportunity: 0,
    receivedCount: 0,
    noTouchAcedCount: 0,
    hittingOpportunity: 0,
    hittingCompletion: 0,
    cleanHits: 0,
    defensiveOpportunity: 0,
    defensiveConversion: 0,
    break: 0,
    broken: 0,
    matchPlayed: 0,
    // Relationship
    net,
    match,
    player,
  }
}

export function singlePlayKey(netId: string, room: string, play: number) {
  return `sr:${netId}:${room}:${play}`;
}

export function netKey(netId: string, room: string) {
  return `sr:${netId}:${room}`;
}


export function playerKey(id: string, netId: string) {
  // A player can play in multiple nets in a match
  return `player:${id}:${netId}`;
}