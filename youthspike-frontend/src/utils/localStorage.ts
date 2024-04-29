import { MUSIC_TIME_PASSED } from './constant';

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

export { hasTimePassed, setMusicPlayedTime };
