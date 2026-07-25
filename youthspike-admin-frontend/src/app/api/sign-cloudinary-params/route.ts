// app/api/sign-cloudinary-params/route.ts

import cloudinary from "@/lib/cloudinary";

export async function POST(request: Request) {
  const { paramsToSign } = await request.json();

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return Response.json({ signature });
}