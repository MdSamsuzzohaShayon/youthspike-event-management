// function readDate(isoString: string) {
//     // Convert ISO string to Date object
//     const date = new Date(isoString);

import { EEventPeriod } from '@/types/event';

//     // Format the date using Intl.DateTimeFormat with only date options
//     const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
//     const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

//     return formattedDate;
// }

const monthNamesShort: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// const monthNames: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function readDate(isoDateString: string) {
  try {
    const newDate = isoDateString.split('T')[0].split('-');

    // Format the date string
    const formattedDate = `${monthNamesShort[parseInt(newDate[1], 10) - 1]} ${newDate[2]}, ${newDate[0]}`;

    return formattedDate;
  } catch (error) {
    const date = new Date(isoDateString);

    // Extract the month, date, and year
    const month = monthNamesShort[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const formattedDate = `${month} ${day}, ${year}`;
    return formattedDate;
  }
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

export { readDate, readTime, validateMatchDatetime };
