import { EEventPeriod } from "@/types/event";


// Check - readDatetime, readTime, validateMatchDatetime
// Array of month names
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function validateMatchDatetime(isoString: string | null): EEventPeriod {
    if (!isoString || isoString === "") return EEventPeriod.PAST;;
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


function readDate(isoDateString: string) {
    const date = new Date(isoDateString);

    // Extract the month, date, and year
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    // Format the date string
    const formattedDate = `${month} ${day}, ${year}`;

    return formattedDate;
}




function defaultInputValue(isoString: string): string {
    if (!isoString || isoString === "") return "";

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
};



export { validateMatchDatetime, defaultInputValue, readDate, formatUSPhoneNumber, getCurrentDate };