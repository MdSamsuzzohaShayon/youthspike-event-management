function readDate(isoString: string) {
    // Convert ISO string to Date object
    const date = new Date(isoString);

    // Format the date using Intl.DateTimeFormat with only date options
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

    return formattedDate;
}

export { readDate };