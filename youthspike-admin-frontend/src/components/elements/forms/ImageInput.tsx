/**
 * ImageInput — resize, crop, and preview an image.
 *
 * References:
 *  https://codesandbox.io/p/sandbox/react-image-crop-demo-with-react-hooks-0h4db
 *  https://codesandbox.io/p/sandbox/react-easy-crop-v69ly910ql
 */
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import ImagePreview from './ImagePreview';
import compressImageIfNeeded from '@/utils/compressImageIfNeeded';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type AspectRatio = '1:1' | '1:1.5';

export interface ImageInputProps {
  name: string;
  label?: string;
  className?: string;
  required?: boolean;
  value?: string | number | null;
  readOnly?: boolean;
  defaultValue?: string | null;
  aspectRatio?: AspectRatio;
  onFileChange?: (file: Blob) => void;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const ASPECT_RATIO_MAP: Record<AspectRatio, number> = {
  '1:1': 1,
  '1:1.5': 1 / 1.5,
};



const VALID_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (!VALID_IMAGE_TYPES.has(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, GIF, WEBP, or SVG).';
  }
  // if (file.size > MAX_FILE_SIZE_BYTES) {
  //   return 'Image size must be less than 5 MB.';
  // }
  return null;
}

function buildInitialCrop(aspect: number): Crop {
  return { unit: 'px', x: 0, y: 0, width: 200, height: 200 / aspect };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Crops the image element to the given pixel crop using canvas,
 * accounting for the difference between displayed size and natural size.
 */
function cropImageToBlob(
  imgEl: HTMLImageElement,
  pixelCrop: PixelCrop,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');

  // Scale factors: natural size vs displayed (rendered) size
  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;

  canvas.width = Math.floor(pixelCrop.width * scaleX);
  canvas.height = Math.floor(pixelCrop.height * scaleY);

  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  ctx.drawImage(
    imgEl,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

function ImageInput({
  name,
  label,
  className,
  defaultValue,
  aspectRatio = '1:1',
  onFileChange,
}: ImageInputProps) {
  const aspect = ASPECT_RATIO_MAP[aspectRatio];

  // Raw (uncropped) data URL shown inside the crop dialog
  const [uncroppedSrc, setUncroppedSrc] = useState<string | null>(null);

  // The current crop selection (drives the crop UI)
  const [crop, setCrop] = useState<Crop>(buildInitialCrop(aspect));

  // The last completed pixel crop — used when the user confirms
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  // Object URL of the final cropped image shown as preview
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);

  // Original file kept for the "Cancel" fallback
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Display name for the selected file
  const [filename, setFilename] = useState<string | null>(null);

  const imgCropRef = useRef<HTMLImageElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Dialog helpers ──────────────────────────

  const openModal = useCallback(() => dialogRef.current?.showModal(), []);
  const closeModal = useCallback(() => dialogRef.current?.close(), []);

  // ── File input trigger ──────────────────────

  const handleOpenFilePicker = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  }, []);

  // ── File selection ──────────────────────────

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const error = validateFile(file);
      if (error) {
        alert(error);
        e.target.value = ''; // allow re-selecting the same file
        return;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        setOriginalFile(file);
        setFilename(file.name);
        setUncroppedSrc(dataUrl);
        setCompletedCrop(null);
        setCrop(buildInitialCrop(aspect));
        openModal();
      } catch {
        alert('Failed to read the selected file. Please try again.');
      }
    },
    [aspect, openModal],
  );

  // ── Core crop application ───────────────────

  /**
   * Renders the given PixelCrop onto a canvas and updates the preview.
   * Returns false if the crop could not be applied.
   */
  const applyCompletedCrop = useCallback(
    async (pixelCrop: PixelCrop): Promise<boolean> => {
      const imgEl = imgCropRef.current;
      if (!imgEl || pixelCrop.width === 0 || pixelCrop.height === 0) {
        return false;
      }

      const blob = await cropImageToBlob(imgEl, pixelCrop);
      if (!blob) return false;

      const url = URL.createObjectURL(blob);
      setCroppedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev); // avoid memory leaks
        return url;
      });
      const finalBlob = await compressImageIfNeeded(blob);

      onFileChange?.(finalBlob);
      return true;
    },
    [onFileChange],
  );

  // ── Crop UI callbacks ───────────────────────

  const handleCropChange = useCallback((newCrop: Crop) => {
    setCrop(newCrop);
  }, []);

  // onComplete gives us the final PixelCrop; just store it — don't render yet
  const handleCropComplete = useCallback((pixelCrop: PixelCrop) => {
    setCompletedCrop(pixelCrop);
  }, []);

  // ── Dialog actions ──────────────────────────

  const handleConfirm = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();

      if (!completedCrop) {
        closeModal();
        return;
      }

      const success = await applyCompletedCrop(completedCrop);
      if (!success) {
        alert('Could not apply the crop. Please try selecting the area again.');
        return;
      }

      closeModal();
    },
    [completedCrop, applyCompletedCrop, closeModal],
  );

  const handleCancel = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      closeModal();

      if (!originalFile) return;

      // Fall back to the full (uncropped) original file
      const url = URL.createObjectURL(originalFile);
      setCroppedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      onFileChange?.(originalFile);
    },
    [originalFile, onFileChange, closeModal],
  );

  // ── Preview memoisation ─────────────────────

  const preview = useMemo(
    () => (
      <ImagePreview
        name={name}
        croppedUrl={croppedUrl}
        defaultValue={!filename ? defaultValue : null}
        onClick={handleOpenFilePicker}
      />
    ),
    [name, croppedUrl, filename, defaultValue, handleOpenFilePicker],
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className={`flex flex-col gap-3 ${className ?? ''}`}>
      {/* Label */}
      <label
        htmlFor={name}
        className="uppercase text-lg font-semibold text-gray-300 dark:text-gray-100"
      >
        {label ?? `Upload ${name}`}
      </label>

      {/* Preview + file info */}
      <div className="flex flex-col gap-6">
        <div className="flex-1">{preview}</div>

        {filename && (
          <p
            className="truncate text-sm font-medium text-gray-700 dark:text-gray-300"
            title={filename}
          >
            {filename}
          </p>
        )}

        {/* Hidden file input */}
        <input
          id={name}
          name={name}
          ref={fileInputRef}
          type="file"
          accept={[...VALID_IMAGE_TYPES].join(',')}
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Crop dialog */}
      <dialog ref={dialogRef} className="modal-dialog">
        <div className="p-4 flex flex-col items-center gap-4">
          {uncroppedSrc && (
            <ReactCrop
              crop={crop}
              aspect={aspect}
              onChange={handleCropChange}
              onComplete={handleCropComplete}
              className="max-h-[70vh] overflow-auto"
            >
              {/* @ts-ignore — next/image cannot be used inside ReactCrop */}
              <img
                src={uncroppedSrc}
                alt="Image to crop"
                ref={imgCropRef}
                className="max-w-full"
              />
            </ReactCrop>
          )}

          <div className="w-full flex justify-end gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-primary rounded-md px-4 py-2"
            >
              Ok
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-danger rounded-md px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default ImageInput;