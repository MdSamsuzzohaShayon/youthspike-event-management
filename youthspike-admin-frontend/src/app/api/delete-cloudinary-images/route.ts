import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

interface DeleteImagesRequest {
  publicIds: string[];
}

export async function DELETE(req: NextRequest) {
  try {
    const { publicIds } = (await req.json()) as DeleteImagesRequest;

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "publicIds must be a non-empty array.",
        },
        { status: 400 }
      );
    }

    const result = await cloudinary.api.delete_resources(publicIds);

    return NextResponse.json({
      success: true,
      message: "Images deleted successfully.",
      result,
    });
  } catch (error) {
    console.error("Delete images error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete images.",
      },
      { status: 500 }
    );
  }
}