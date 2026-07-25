interface SignatureResponse {
    signature: string;
}

interface CloudinaryUploadResponse {
    public_id: string;
    secure_url: string;
}


// ---------------------------------------------------------------------------
// Cloudinary direct (signed) upload
// ---------------------------------------------------------------------------

const CLOUDINARY_CLOUD_NAME = process.env
    .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
const CLOUDINARY_API_KEY = process.env
    .NEXT_PUBLIC_CLOUDINARY_API_KEY as string;

/**
 * Signs the upload params via our own backend, then uploads the file
 * directly to Cloudinary. Returns the resulting public ID.
 */
async function uploadImageToCloudinary(
    file: File,
    folder?: string
): Promise<string> {
    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign: Record<string, string | number> = folder
        ? { timestamp, folder }
        : { timestamp };

    const signResponse = await fetch("/api/sign-cloudinary-params", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign }),
    });

    if (!signResponse.ok) {
        throw new Error("Failed to sign the upload request.");
    }

    const { signature } = (await signResponse.json()) as SignatureResponse;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    if (folder) formData.append("folder", folder);

    const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
    );

    if (!uploadResponse.ok) {
        const errorBody = (await uploadResponse.json().catch(() => null)) as {
            error?: { message?: string };
        } | null;
        throw new Error(
            errorBody?.error?.message ?? "Failed to upload image to Cloudinary."
        );
    }

    const data = (await uploadResponse.json()) as CloudinaryUploadResponse;
    return data.public_id;
}


export default uploadImageToCloudinary;