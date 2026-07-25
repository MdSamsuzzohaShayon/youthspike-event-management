export async function deleteDraftImages(publicIds: string[]) {
    const response = await fetch("/api/delete-cloudinary-images", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicIds }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete images.");
    }

    return data;
}


export default deleteDraftImages;