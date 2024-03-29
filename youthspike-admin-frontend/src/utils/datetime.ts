import { EEventPeriod } from "@/types/event";

function validateMatchDatetime(isoString: string | null): EEventPeriod {
    if (!isoString || isoString === "") return EEventPeriod.PASSED;;
    const targetDate = new Date(isoString);
    const currDate = new Date();

    targetDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);

    if (targetDate < currDate) {
        return EEventPeriod.PASSED;
    } 
    // else if (targetDate > currDate) {
    //     return EEventPeriod.UPCOMING;
    // }
    return EEventPeriod.CURRENT;
}

function readDatetime(isoString: string) {
    const targetDate = new Date(isoString);

    const formatter = new Intl.DateTimeFormat('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
    });

    return formatter.format(targetDate);
}


function defaultInputValue(isoString: string): string {
    if (!isoString || isoString === "") return "";

    // Extract year, month, and day
    const [year, month, day] = isoString.slice(0, 10).split('-');

    // Create the formatted date string
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

export { validateMatchDatetime, readDatetime, defaultInputValue };