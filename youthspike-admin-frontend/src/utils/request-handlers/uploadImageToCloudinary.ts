interface SignatureResponse {
  signature: string;
}

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string;
const CLOUDINARY_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string;

interface UploadImageOptions {
  file: File;
  folder?: string;
  width?: number;
  height?: number;
  quality?: string;
}

/**
 * Signs the upload params via our own backend, then uploads the file
 * directly to Cloudinary with proper transformations.
 */
async function uploadImageToCloudinary({
  file,
  folder,
}: UploadImageOptions): Promise<CloudinaryUploadResponse> {
  const timestamp = Math.round(Date.now() / 1000);

  // Only sign basic upload params - NO transformations
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    ...(folder && { folder }),
  };

  // Get signature from backend
  const signResponse = await fetch('/api/sign-cloudinary-params', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paramsToSign }),
  });

  if (!signResponse.ok) {
    const errorBody = await signResponse.json().catch(() => null);
    throw new Error(
      `Failed to sign upload request: ${errorBody?.message || signResponse.statusText}`
    );
  }

  const { signature } = (await signResponse.json()) as SignatureResponse;

  // Prepare form data - only basic params, no transformations
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);

  if (folder) {
    formData.append('folder', folder);
  }

  // Upload to Cloudinary
  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.json().catch(() => null);
    throw new Error(
      errorBody?.error?.message ?? 'Failed to upload image to Cloudinary.'
    );
  }

  const uploadResult = await uploadResponse.json();

  return {
    public_id: uploadResult.public_id,
    secure_url: uploadResult.secure_url,
    url: uploadResult.url,
    width: uploadResult.width,
    height: uploadResult.height,
  };
}

export default uploadImageToCloudinary;