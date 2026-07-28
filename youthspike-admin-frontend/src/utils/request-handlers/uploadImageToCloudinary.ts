interface SignatureResponse {
    signature: string;
  }
  
  interface CloudinaryUploadResponse {
    public_id: string;
    secure_url: string;
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
    width = 300,
    height = 300,
    quality = 'auto:good',
  }: UploadImageOptions): Promise<CloudinaryUploadResponse> {
    const timestamp = Math.round(Date.now() / 1000);
  
    // Build params to sign - only include upload API parameters
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      ...(folder && { folder }),
      // Only sign these if you're sending them in the upload request
      eager: `c_limit,w_${width},h_${height},q_${quality},f_auto`,
      eager_async: 'false',
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
  
    // Prepare form data - MUST include ALL signed parameters
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('eager', `c_limit,w_${width},h_${height},q_${quality},f_auto`);
    formData.append('eager_async', 'false');
    
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
      width: uploadResult.width,
      height: uploadResult.height,
    };
  }
  
  export default uploadImageToCloudinary;