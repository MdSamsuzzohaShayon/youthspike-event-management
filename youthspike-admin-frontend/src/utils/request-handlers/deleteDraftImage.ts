const deleteDraftImage = async (publicId: string) => {
    if (!publicId) return null;

    try {
        const response = await fetch("/api/delete-cloudinary-image", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ publicId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message ?? "Failed to delete image.");
        }

        return data;
    } catch (error) {
        console.error("Failed to delete draft image:", error);
        throw error;
    }
}


export default deleteDraftImage;