// ---------------------------------------------------------------------------
// ImageUploader — single responsibility: pick + validate + upload a file.
// Upload state is now fully controlled by the parent (single source of
// truth) instead of duplicating it in local state.
// ---------------------------------------------------------------------------

import { isFileTooLarge, isValidImageFile } from "@/utils/badge/badge-helpers";
import { MAX_FILE_SIZE_BYTES } from "@/utils/constant";
import uploadImageToCloudinary from "@/utils/request-handlers/uploadImageToCloudinary";
import { Loader2, Upload } from "lucide-react";
import { ChangeEvent, useCallback, useRef } from "react";

interface ImageUploaderProps {
    /** Current Cloudinary public_id, if any. */
    value: string;
    isUploading: boolean;
    onChange: (publicId: string) => void;
    onUploadStart: () => void;
    onUploadEnd: () => void;
    onError: (message: string) => void;
    folder?: string;
}

const ACCEPTED_MIME_TYPES = "image/png, image/jpeg, image/gif, image/webp";
const ImageUploader: React.FC<ImageUploaderProps> = ({
    value,
    isUploading,
    onChange,
    onUploadStart,
    onUploadEnd,
    onError,
    folder,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetFileInput = useCallback(() => {
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const handleFileSelect = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            if (!isValidImageFile(file)) {
                onError("Please select an image file.");
                resetFileInput();
                return;
            }
            if (isFileTooLarge(file)) {
                onError(`Image size should be less than 200KB.`);
                resetFileInput();
                return;
            }

            onUploadStart();
            try {
                const publicId = await uploadImageToCloudinary(file, folder);
                onChange(publicId);
            } catch (error) {
                console.error("Badge image upload failed:", error);
                onError(
                    error instanceof Error
                        ? error.message
                        : "Failed to upload image. Please try again."
                );
            } finally {
                onUploadEnd();
                resetFileInput();
            }
        },
        [folder, onChange, onError, onUploadEnd, onUploadStart, resetFileInput]
    );

    return (
        <div className="relative">
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MIME_TYPES}
                onChange={handleFileSelect}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                aria-label="Upload badge image"
            />
            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors duration-150 cursor-pointer ${value
                        ? "border-yellow-500/50 bg-gray-800 text-gray-300"
                        : "border-dashed border-gray-600 bg-gray-800/50 text-gray-500 hover:border-yellow-500/50"
                    }`}
            >
                {isUploading ? (
                    <Loader2 size={16} className="flex-shrink-0 animate-spin" />
                ) : (
                    <Upload size={16} className="flex-shrink-0" />
                )}
                <span className="text-sm truncate">
                    {isUploading ? "Uploading..." : value ? "Change image" : "Choose image"}
                </span>
            </div>
        </div>
    );
};


export default ImageUploader;