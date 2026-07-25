import cloudinary from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";



export async function DELETE(req: NextRequest) {
  try {
    const { publicId } = await req.json();

    if (!publicId) {
      return NextResponse.json(
        { message: "publicId is required." },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      return NextResponse.json(
        { message: "Failed to delete image.", result },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Internal Server Error." },
      { status: 500 }
    );
  }
}