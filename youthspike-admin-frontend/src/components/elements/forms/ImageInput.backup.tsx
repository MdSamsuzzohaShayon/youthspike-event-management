
import cld from '@/config/cloudinary.config';
import { IImageFileProps } from '@/types';
import { fileToImgSrc, getCroppedImgBlob, handleScaleImage } from '@/utils/croppedImage';
import { AdvancedImage } from '@cloudinary/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface IDimension {
  w: number;
  h: number;
}

const INIT_CROP: Crop = { unit: 'px', x: 0, y: 0, width: 200, height: 200 };

function ImageInput({ handleFileChange, name, label, className, defaultValue }: IImageFileProps) {
  const [srcUncropped, setSrcUncropped] = useState<string | null | ArrayBuffer>(null);
  const [crop, setCrop] = useState<Crop>(INIT_CROP);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [originalImg, setOriginalImg] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<IDimension>({ w: 0, h: 0 });
  const [scaledImgUrl, setScaledImgUrl] = useState<string | ArrayBuffer | null>(null);

  const imgCropEl = useRef<HTMLImageElement | null>(null);
  const dialogEl = useRef<HTMLDialogElement | null>(null);
  const imageInputEl = useRef<HTMLInputElement>(null);

  // Memoized modal handlers
  const openModal = useCallback(() => dialogEl.current?.showModal(), []);
  const closeModal = useCallback(() => dialogEl.current?.close(), []);

  // Optimized file handlers
  const handleOpenImg = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    imageInputEl.current?.click();
  }, []);

  const handleImgFileChange = useCallback(async (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    if (!inputEl.files?.[0]) return;

    const file = inputEl.files[0];
    setOriginalImg(file);
    setFilename(file.name);
    handleFileChange?.(file);

    const uploadedImgUrl = await fileToImgSrc(file);
    if (uploadedImgUrl) {
      setSrcUncropped(uploadedImgUrl);
      openModal();
    }
  }, [handleFileChange, openModal]);

  // Optimized crop handlers
  const handleCropChange = useCallback((newCrop: Crop) => {
    setCrop(newCrop);
  }, []);

  const setCroppedImg = useCallback(async (updateCrop: Crop) => {
    if (!scaledImgUrl) return;
    
    const cib = await getCroppedImgBlob(scaledImgUrl, updateCrop);
    if (!cib) return;

    const ciu = URL.createObjectURL(cib);
    setCroppedImageUrl(ciu);
    handleFileChange?.(cib);
  }, [scaledImgUrl, handleFileChange]);

  const onCropComplete = useCallback(async (newCrop: Crop) => {
    setCrop(newCrop);
    await setCroppedImg(newCrop);
  }, [setCroppedImg]);

  // Optimized dialog actions
  const handleConfirmUpload = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
    await setCroppedImg(crop);
  }, [crop, closeModal, setCroppedImg]);

  const handleCancelUpload = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
    
    if (!originalImg) return;
    const ciu = URL.createObjectURL(originalImg);
    setCroppedImageUrl(ciu);
    handleFileChange?.(originalImg);
  }, [originalImg, closeModal, handleFileChange]);

  // Optimized effect for image scaling
  useEffect(() => {
    if (!imgCropEl.current || !originalImg) return;

    const { clientWidth: w, clientHeight: h } = imgCropEl.current;
    if (w === 0 || h === 0 || (w === dimensions.w && h === dimensions.h)) return;

    const scaleAndSetImage = async () => {
      setDimensions({ w, h });
      const scaledImgFile = await handleScaleImage(originalImg, w, h);
      if (!scaledImgFile) return;

      setOriginalImg(scaledImgFile);
      handleFileChange?.(scaledImgFile);
      
      const url = await fileToImgSrc(scaledImgFile);
      setScaledImgUrl(url);
    };

    scaleAndSetImage();
  }, [originalImg, dimensions, handleFileChange]);

  // Memoized image render function
  const renderImage = useMemo(() => {
    if (!filename) {
      if (defaultValue && typeof defaultValue === 'string') {
        return <AdvancedImage className='w-full object-cover object-center' cldImg={cld.image(defaultValue)} />;
      }
      return null;
    }
    if (croppedImageUrl) {
      return <img src={croppedImageUrl} alt='file-upload' className='w-full' />;
    }
    return null;
  }, [filename, defaultValue, croppedImageUrl]);

  return (
    <div className={`flex flex-col ${className || ""}`}>
      <label htmlFor={name} className="capitalize text-lg font-semibold mb-1">
        {label || `Upload ${name}`}
      </label>
      <div className={`flex items-center gap-4`}>
        <div className="w-full flex justify-between gap-2">
          <div className='w-3/6'>
            {renderImage}
          </div>
          <div className="btn-text w-full flex flex-col w-3/6 justify-center gap-2">
            {filename && <p>{filename}</p>}
            <button 
              className="w-full bg-yellow-400 text-black p-3 rounded-md font-semibold flex items-center gap-2" 
              onClick={handleOpenImg}
            >
              File Upload
              <img src='/icons/upload.svg' alt='upload' className='w-6 svg-black' />
            </button>
          </div>
        </div>
        <input 
          onChange={handleImgFileChange}
          id={name} 
          name={name}
          className="hidden" 
          ref={imageInputEl}
          type="file"
        />
      </div>

      <dialog ref={dialogEl} className='w-10/12'>
        <div className="px-2 flex flex-col items-center justify-between gap-2" >
          {srcUncropped && (
            <ReactCrop crop={crop} onChange={handleCropChange} onComplete={onCropComplete}>
              <img 
                id="img-to-crop" 
                // @ts-ignore 
                src={srcUncropped} 
                alt="file-upload" 
                ref={imgCropEl} 
                className="h-32"
              />
            </ReactCrop>
          )}
          <div className="buttons w-full flex justify-start items-center gap-x-2">
            <button type='button' onClick={handleConfirmUpload} className="btn-primary">
              Ok
            </button>
            <button type='button' onClick={handleCancelUpload} className="btn-danger">
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default React.memo(ImageInput);