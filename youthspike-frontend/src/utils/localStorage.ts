import { ETeam } from '@/types/team';
import { MATCHES_LS, MUSIC_TIME_PASSED } from './constant';

const hasTimePassed = (secondsPassed: number): boolean => {
  const musicPlayedTime = localStorage.getItem(MUSIC_TIME_PASSED); // ISO Time
  if (!musicPlayedTime) return true;

  const givenTime = new Date(musicPlayedTime);
  const currentTime = new Date();

  // Calculate the time difference in seconds
  const timeDifferenceSec = (currentTime.getTime() - givenTime.getTime()) / 1000;

  // Check if at least the specified seconds have passed
  if (timeDifferenceSec < secondsPassed) return false;

  // Compare full date and time
  return currentTime > givenTime;
};

const setMusicPlayedTime = (): void => {
  const currentTime = new Date().toISOString();
  localStorage.setItem(MUSIC_TIME_PASSED, currentTime);
};

interface IMatchLS {
  matchId: string;
  roundId: string;
  date: string;
}

const expiredMatches = (matchList: IMatchLS[]): IMatchLS[] => {
  const newMatchList = [];
  const currentDate = new Date();

  for (let i = 0; i < matchList.length; i += 1) {
    const isoDate = new Date(matchList[i].date);

    // Calculate the difference in milliseconds between the current date and the parsed date
    const differenceInMilliseconds = currentDate.getTime() - isoDate.getTime(); // Explicitly convert to number

    // Convert milliseconds to days
    const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);

    // Check if the difference is greater than or equal to 10 days
    if (differenceInDays < 10) {
      newMatchList.push(matchList[i]);
    }
  }

  return newMatchList;
};

/**
 * Set match Id and round Id in the local storage as an array, get previous matches and update theam
 * @param matchId
 * @param roundId
 */
const setMatch = (matchId: string, roundId: string) => {
  const matchList: IMatchLS[] = [];
  const matchesLs = localStorage.getItem(MATCHES_LS);
  if (matchesLs) {
    const parsedData = JSON.parse(matchesLs);
    matchList.push(...parsedData);
  }
  const matchIdx = matchList.findIndex((m) => m.matchId === matchId);
  const currDate = new Date();
  if (matchIdx !== -1) {
    matchList[matchIdx] = { matchId, roundId, date: currDate.toISOString() };
  } else {
    matchList.push({ matchId, roundId, date: currDate.toISOString() });
  }
  const validMatches = expiredMatches(matchList);
  localStorage.setItem(MATCHES_LS, JSON.stringify(validMatches));
};

const getMatch = (matchId: string): null | IMatchLS => {
  const matchesLs = localStorage.getItem(MATCHES_LS);
  if (!matchesLs) return null;
  const matchList: IMatchLS[] = JSON.parse(matchesLs);
  const matchIdx = matchList.findIndex((m) => m.matchId === matchId);
  if (matchIdx !== -1) {
    return matchList[matchIdx];
  }

  return null;
};

const setEvent = (eventId: string) => {
  if (eventId) localStorage.setItem('eventId', eventId);
};

const getEvent = (): string | null => {
  const eventId = localStorage.getItem('eventId');
  return eventId ?? null;
};

const removeEvent = () => {
  localStorage.removeItem('eventId');
};

const setLocalTeam = (teamE: ETeam): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure teamE is serialized to a string, e.g., using JSON if it's an object
      localStorage.setItem('selectedTeamForAdmin', JSON.stringify(teamE));
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

const getLocalTeam = (): Promise<ETeam | null> => {
  return new Promise((resolve, reject) => {
    try {
      const teamE = localStorage.getItem('selectedTeamForAdmin');
      // If there's a stored value, parse it, otherwise return null
      if (teamE) {
        resolve(JSON.parse(teamE) as ETeam);
      } else {
        resolve(null);
      }
    } catch (error) {
      reject(error);
    }
  });
};

export { hasTimePassed, setMusicPlayedTime, setMatch, getMatch, setEvent, getEvent, removeEvent, setLocalTeam, getLocalTeam };
