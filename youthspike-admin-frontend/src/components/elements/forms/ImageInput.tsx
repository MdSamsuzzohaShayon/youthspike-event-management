/**
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-with-react-hooks-0h4db
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-s8xr4?file=%2Fsrc%2Findex.js%3A100%2C12-100%2C21
 * https://codesandbox.io/p/sandbox/react-easy-crop-v69ly910ql?file=%2Fsrc%2Findex.js
 * */
import { IImageFileProps } from '@/types';
import { fileToImgSrc, getCroppedImgBlob, handleScaleImage } from '@/utils/croppedImage';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface IDimension {
  w: number;
  h: number;
}

const INIT_CROP: Crop = { unit: 'px', x: 0, y: 0, width: 200, height: 200 };

function ImageInput({ handleFileChange, name, label, className, defaultValue }: IImageFileProps) {
  const [srcUncropped, setSrcUncropped] = useState<string | ArrayBuffer | null>(null);

  const [crop, setCrop] = useState<Crop>(INIT_CROP);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  // Keep image size same with background element
  const [orginalImg, setOriginalImg] = useState<null | File>(null);
  const [pDimension, setPDimension] = useState<IDimension>({ w: 0, h: 0 });
  const imgCropEl = useRef<HTMLImageElement | null>(null);
  const [scaledImgUrl, setScaledImgUrl] = useState<string | ArrayBuffer | null>(null);

  // Dialog
  const dialogEl = useRef<HTMLDialogElement | null>(null);
  const imageInputEl = useRef<HTMLInputElement>(null);

  const openModal = () => {
    if (dialogEl && dialogEl.current) dialogEl.current.showModal();
  };
  const closeModal = () => {
    if (dialogEl && dialogEl.current) dialogEl.current.close();
  };

  const handleOpenImg = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!imageInputEl.current) return;
    imageInputEl.current.click();
  };

  const handleImgFileChange = useCallback(
    async (e: React.SyntheticEvent) => {
      const inputEl = e.target as HTMLInputElement;
      if (!inputEl.files?.[0]) return;

      const file = inputEl.files[0];

      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validImageTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, GIF, WEBP, or SVG)');
        return;
      }

      // Validate file size if needed (example: 5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Image size must be less than 5MB');
        return;
      }

      setOriginalImg(file);
      setFilename(file.name);
      handleFileChange?.(file);

      const uploadedImgUrl = await fileToImgSrc(file);
      if (uploadedImgUrl) {
        setSrcUncropped(uploadedImgUrl);
        openModal();
      }
    },
    [handleFileChange, openModal],
  );

  const handleCropChange = (newCrop: Crop) => {
    // console.log({newCrop});

    setCrop(newCrop); // Update the crop state
  };

  const setCroppedImg = async (updateCrop: Crop) => {
    const cib = await getCroppedImgBlob(scaledImgUrl, updateCrop); // Generate and set the cropped image URL
    if (!cib) return;
    const ciu = URL.createObjectURL(cib);
    if (ciu) setCroppedImageUrl(ciu); // Set the URL of the cropped image
    if (handleFileChange) handleFileChange(cib);
  };

  const onCropComplete = async (newCrop: Crop) => {
    setCrop(newCrop); // Update the crop state
    // console.log({newCrop});
    await setCroppedImg(newCrop);
  };

  const handleConfirmUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
    await setCroppedImg(crop);
  };
  const handleCancelUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
    if (!orginalImg) return;
    const ciu = URL.createObjectURL(orginalImg);
    if (ciu) setCroppedImageUrl(ciu); // Set the URL of the cropped image
    if (handleFileChange) handleFileChange(orginalImg);
  };

  useEffect(() => {
    (async () => {
      if (
        imgCropEl.current &&
        (imgCropEl.current.clientHeight !== pDimension.h || imgCropEl.current.clientWidth !== pDimension.w) &&
        imgCropEl.current.clientHeight !== 0 &&
        imgCropEl.current.clientWidth !== 0
      ) {
        // console.log({w: imgCropEl.current.clientWidth, h: imgCropEl.current.clientHeight});
        setPDimension({ w: imgCropEl.current.clientWidth, h: imgCropEl.current.clientHeight });
        if (orginalImg) {
          const scaleedImgFile = await handleScaleImage(orginalImg, imgCropEl.current.clientWidth, imgCropEl.current.clientHeight);

          if (scaleedImgFile) {
            setOriginalImg(scaleedImgFile);
            if (handleFileChange) handleFileChange(scaleedImgFile);
            const url = await fileToImgSrc(scaleedImgFile);
            setScaledImgUrl(url);
          }
        }
      }
    })();
  });

  const renderImage = useMemo(() => {
    let imgEl: null | HTMLImageElement | React.ReactNode = null;
    if (!filename || filename === '') {
      if (defaultValue && typeof defaultValue === 'string') {
        imgEl = <CldImage width={100} height={100} role="presentation" onClick={handleOpenImg} className="w-full md:w-1/3 object-cover object-center" sizes="100vw" alt="Description of my image" src={defaultValue} />;
      }
    } else {
      if (croppedImageUrl && croppedImageUrl !== '') {
        imgEl = <Image width={50} height={50} role="presentation" onClick={handleOpenImg} src={croppedImageUrl} alt="file-upload" className="w-full" />;
      }
    }
    return imgEl;
  }, [filename, defaultValue, croppedImageUrl]);

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      {/* Label */}
      <label
        htmlFor={name}
        className="text-lg font-semibold text-gray-800 dark:text-gray-100"
      >
        {label || `Upload ${name}`}
      </label>

      {/* Main container */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* ─────────── Preview / Placeholder ─────────── */}
        <div className="flex-1">
          {renderImage ? (
            <div className="w-full h-full overflow-hidden rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
              {renderImage}
            </div>
          ) : (
            <label
              htmlFor={name}
              className="flex flex-col items-center justify-center h-full w-full rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 text-sm gap-2 cursor-pointer transition hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-800/40"
              onClick={handleOpenImg}
            >
              <Image
                width={20}
                height={20}
                src="/icons/upload.svg"
                alt="upload icon"
                className="w-8 h-8 svg-white opacity-50"
              />
              <span className="select-none">Click to select an image</span>
            </label>
          )}
        </div>

        {/* ─────────── File info & button ─────────── */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          {/* File name */}
          {filename && (
            <p
              className="truncate text-sm font-medium text-gray-700 dark:text-gray-300"
              title={filename}
            >
              {filename}
            </p>
          )}

          {/* Upload button (same click handler) */}
          {/* <button
            type="button"
            onClick={handleOpenImg}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500"
          >
            File Upload
            <img src="/icons/upload.svg" alt="" className="w-5 h-5" />
          </button> */}

          {/* Hidden file input */}
          <input
            onChange={handleImgFileChange}
            id={name}
            name={name}
            ref={imageInputEl}
            type="file"
            className="hidden"
          />
        </div>
      </div>

      {/* ─────────── Crop Dialog ─────────── */}
      <dialog
        ref={dialogEl}
        className="w-11/12 sm:w-[38rem] max-w-[90vw] rounded-lg shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 backdrop:bg-black/50"
      >
        <div className="p-4 flex flex-col items-center gap-4">
          {srcUncropped && (
            <ReactCrop
              crop={crop}
              onChange={handleCropChange}
              onComplete={onCropComplete}
              className="max-h-[70vh] overflow-auto"
            >
              {/* @ts-ignore */}
              <img
                src={srcUncropped as string}
                alt="image to crop"
                ref={imgCropEl}
                className="max-w-full"
              />
            </ReactCrop>
          )}

          <div className="w-full flex justify-end gap-3">
            <button
              type="button"
              onClick={handleConfirmUpload}
              className="btn-primary rounded-md px-4 py-2"
            >
              Ok
            </button>
            <button
              type="button"
              onClick={handleCancelUpload}
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

/*
<div class="flex flex-col mt-8 w-full max-w-xl mx-auto">
  <!-- Label -->
  <label for="profile" class="text-lg font-semibold text-gray-800 mb-3">Upload Profile</label>

  <!-- Upload Box -->
  <div class="relative flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white transition hover:border-yellow-400 hover:shadow-md">
    <!-- Before Upload -->
    <div id="upload-prompt" class="flex flex-col items-center gap-3 text-gray-600">
      <img src="/icons/upload.svg" alt="Upload" class="w-10 h-10 svg-black opacity-70" />
      <p class="text-sm">Click the button below to select a file</p>
      <label for="profile" class="cursor-pointer">
        <div class="bg-yellow-400 text-black px-5 py-2 rounded-md font-semibold flex items-center gap-2 transition hover:bg-yellow-300">
          File Upload
          <img src="/icons/upload.svg" alt="Upload" class="w-5 h-5 svg-black" />
        </div>
      </label>
    </div>

    <!-- After Upload (hidden by default) -->
    <div id="file-info" class="hidden w-full mt-4 text-sm text-gray-700">
      <span class="font-medium">Selected file:</span>
      <span id="file-name" class="ml-1"></span>
    </div>

    <!-- Hidden File Input -->
    <input id="profile" class="hidden" type="file" name="profile" onchange="handleFileUpload(event)" />
  </div>

  <!-- Optional Dialog -->
  <dialog id="confirmDialog" class="w-full max-w-md mt-6 rounded-md shadow-lg border border-gray-200 p-4">
    <div class="flex flex-col items-center gap-4">
      <p class="text-center text-gray-800 text-sm">Are you sure you want to upload this file?</p>
      <div class="flex gap-4">
        <button type="button" class="btn-primary px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Ok</button>
        <button type="button" class="btn-danger px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Cancel</button>
      </div>
    </div>
  </dialog>
</div>


*/
