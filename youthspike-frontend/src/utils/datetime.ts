// function readDate(isoString: string) {
//     // Convert ISO string to Date object
//     const date = new Date(isoString);

import { EEventPeriod } from '@/types/event';

//     // Format the date using Intl.DateTimeFormat with only date options
//     const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
//     const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

//     return formattedDate;
// }

const monthNamesShort: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function readDate(isoDateString?: string | null): string {
  if (!isoDateString) return '';

  // Keep only the date portion, ignoring the time and timezone.
  const datePart = isoDateString.split('T')[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!match) return 'Invalid date';

  const [, year, month, day] = match;
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const yearNumber = Number(year);

  const daysInMonth = new Date(
    Date.UTC(yearNumber, monthNumber, 0),
  ).getUTCDate();

  if (
    monthNumber < 1 ||
    monthNumber > 12 ||
    dayNumber < 1 ||
    dayNumber > daysInMonth
  ) {
    return 'Invalid date';
  }

  return `${monthNamesShort[monthNumber - 1]} ${dayNumber}, ${year}`;
}

// function readDate(){
//   `${monthNames[new Date(event.startDate).getMonth()]} ${new Date(event.startDate).getDate()}, ${new Date(event.startDate).getFullYear()} `
// }

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


function formatClock(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;

  return (
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0")
  );
}

export { readDate, readTime, validateMatchDatetime, formatClock };
