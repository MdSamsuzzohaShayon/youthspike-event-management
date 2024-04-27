// function readDate(isoString: string) {
//     // Convert ISO string to Date object
//     const date = new Date(isoString);

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

export { readDate, readTime };
