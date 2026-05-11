// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

import { CldImage } from "next-cloudinary";
import Image from "next/image";

interface IPreviewProps {
    name: string;
    croppedUrl: string | null;
    defaultValue?: string | null;
    onClick: (e: React.MouseEvent) => void;
}

function ImagePreview({ name, croppedUrl, defaultValue, onClick }: IPreviewProps) {
    if (croppedUrl) {
        return (
            <div className="w-full overflow-hidden rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={croppedUrl}
                    alt="Cropped preview"
                    role="presentation"
                    onClick={onClick}
                    className="w-full object-cover object-center cursor-pointer"
                />
            </div>
        );
    }

    if (defaultValue) {
        return (
            <div className="w-full overflow-hidden rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
                <CldImage
                    width={100}
                    height={100}
                    crop="fit"
                    role="presentation"
                    onClick={onClick}
                    className="w-full object-cover object-center cursor-pointer"
                    sizes="100vw"
                    alt="Current image"
                    src={defaultValue}
                />
            </div>
        );
    }

    return (
        <label
            htmlFor={name}
            onClick={onClick}
            className="flex flex-col items-center justify-center w-full rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 text-sm gap-2 cursor-pointer transition hover:border-yellow-400 hover:bg-gray-800"
        >
            <Image
                width={20}
                height={20}
                src="/icons/upload.svg"
                alt="Upload icon"
                className="w-8 h-8 svg-white opacity-50"
            />
            <span className="select-none">Click to select an image</span>
        </label>
    );
}


export default ImagePreview;