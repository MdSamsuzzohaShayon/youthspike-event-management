import { IEmailcontent } from '@/types';
import { EEventPeriod } from '@/types/event';

// Check - readDatetime, readTime, validateMatchDatetime
// Array of month names
const monthNames: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Create an array of month names
const monthNamesShort: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function validateMatchDatetime(isoString: string | null): EEventPeriod {
  if (!isoString || isoString === '') return EEventPeriod.PAST;
  const targetDate = new Date(isoString);
  const currDate = new Date();

  // targetDate.setHours(0, 0, 0, 0);
  // currDate.setHours(0, 0, 0, 0);

  targetDate.setUTCHours(0, 0, 0, 0);
  currDate.setUTCHours(0, 0, 0, 0);

  if (targetDate < currDate) {
    return EEventPeriod.PAST;
  }
  // else if (targetDate > currDate) {
  //     return EEventPeriod.UPCOMING;
  // }
  return EEventPeriod.CURRENT;
}

function readDate(isoDateString: string): string {
  // Handle empty, null, or undefined input
  
  if (!isoDateString) {
    console.warn('readDate: Empty or invalid date string provided');
    return 'Invalid Date';
  }

  // Try parsing as ISO string first (faster and more reliable)
  try {
    const date = new Date(isoDateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${isoDateString}`);
    }
    
    // Extract date components
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch (error) {
    // Fallback to manual parsing if Date object fails
    try {
      // Check if it's an ISO format (YYYY-MM-DD or with time)
      const match = isoDateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      
      if (match) {
        const year = match[1];
        const monthIndex = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        
        // Validate month and day ranges
        if (monthIndex < 0 || monthIndex > 11) {
          throw new Error(`Invalid month: ${match[2]}`);
        }
        
        if (day < 1 || day > 31) {
          throw new Error(`Invalid day: ${match[3]}`);
        }
        
        return `${monthNames[monthIndex]} ${day}, ${year}`;
      }
      
      // Handle other common date formats
      const date = new Date(isoDateString);
      if (isNaN(date.getTime())) {
        throw new Error(`Unable to parse date: ${isoDateString}`);
      }
      
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      
      return `${month} ${day}, ${year}`;
      
    } catch (fallbackError) {
      console.error('readDate: Failed to parse date', {
        input: isoDateString,
        originalError: error,
        fallbackError
      });
      
      return 'Invalid Date';
    }
  }
}

function readTimestamp(timestamp: number): string {
  const date = new Date(timestamp);

  const day = date.toLocaleString("en-GB", {
    day: "2-digit",
  });

  const month = date
    .toLocaleString("en-GB", {
      month: "short",
    })
    .toLowerCase();

  const year = date.getFullYear();

  return `${day} ${month}, ${year}`;
}

function readDateTemp(isoDateString: string) {
  const date = new Date(isoDateString);

  // Extract the month, date, and year
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const formattedDate = `${month} ${day}, ${year}`;
  return formattedDate;
}

function defaultInputValue(isoString: string): string {
  if (!isoString || isoString === '') return '';

  // Extract year, month, and day
  const [year, month, day] = isoString.slice(0, 10).split('-');

  // Create the formatted date string
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

function formatUSPhoneNumber(number: string) {
  const areaCode = number.slice(0, 3);
  const prefix = number.slice(3, 6);
  const lineNumber = number.slice(6);

  return `(${areaCode}) ${prefix}-${lineNumber}`;
}

function getCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isISODateString(dateString: string): boolean {
  // Check if it's a string and matches the ISO 8601 format
  const isoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[\+\-]\d{2}:\d{2})?$/;
  if (typeof dateString !== 'string' || !isoFormat.test(dateString)) {
    return false;
  }

  // Attempt to parse it as a Date and check if it's valid
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function getLocalDateTimeISO(): string {
  const timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  type DateTimePart = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'literal';

  type DateTimeParts = Partial<Record<Exclude<DateTimePart, 'literal'>, string>>;

  const partsArray = formatter.formatToParts(new Date());

  const parts: DateTimeParts = partsArray.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type as Exclude<DateTimePart, 'literal'>] = part.value;
    }
    return acc;
  }, {} as DateTimeParts);

  const { year, month, day, hour, minute, second } = parts;

  if (!year || !month || !day || !hour || !minute || !second) {
    throw new Error('Failed to extract all date/time parts');
  }

  // Get timezone offset in +06:00 format
  const offsetMin = -new Date().getTimezoneOffset(); // reverse because offset is negative for + zones
  const sign = offsetMin >= 0 ? '+' : '-';
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const offset = `${sign}${pad(offsetMin / 60)}:${pad(offsetMin % 60)}`;

  // console.log(`${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
}

function formatEmailSentTime(
 senttime: string,
): { date: string; time: string } | undefined {

  const date = new Date(senttime);

  return {
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(date),

    time: new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date).toLowerCase(),
  };
}


export { validateMatchDatetime, formatEmailSentTime, defaultInputValue, readDate, formatUSPhoneNumber, getCurrentDate, readDateTemp, isISODateString, getLocalDateTimeISO, monthNamesShort, readTimestamp};
