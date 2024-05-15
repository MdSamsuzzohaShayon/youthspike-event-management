// function readDate(isoString: string) {
//     // Convert ISO string to Date object
//     const date = new Date(isoString);

import { EEventPeriod } from '@/types/event';

//     // Format the date using Intl.DateTimeFormat with only date options
//     const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
//     const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

//     return formattedDate;
// }

function readDate(isoDateString: string) {
  const date = new Date(isoDateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  // @ts-ignore
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

function readTime(isoTimeString: string) {
  const date = new Date(isoTimeString);
  const options = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true, // Ensure AM/PM format
  };
  // @ts-ignore
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

function validateMatchDatetime(isoString: string | null): EEventPeriod {
  if (!isoString || isoString === '') return EEventPeriod.PAST;
  const targetDate = new Date(isoString);
  const currDate = new Date();

  targetDate.setHours(0, 0, 0, 0);
  currDate.setHours(0, 0, 0, 0);

  if (targetDate < currDate) {
    return EEventPeriod.PAST;
  }
  // else if (targetDate > currDate) {
  //     return EEventPeriod.UPCOMING;
  // }
  return EEventPeriod.CURRENT;
}

export { readDate, readTime, validateMatchDatetime };
