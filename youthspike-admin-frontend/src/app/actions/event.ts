'use server'

export const createEvent = (formData: FormData) => {

    console.log("Form submitted----------------------------------");
    for (const [k, v] of formData.entries()) {
        console.log(`Key: ${k}, Value: ${v}`);
        
    }
}