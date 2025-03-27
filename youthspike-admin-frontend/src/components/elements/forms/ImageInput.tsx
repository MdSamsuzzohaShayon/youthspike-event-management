/**
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-with-react-hooks-0h4db
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-s8xr4?file=%2Fsrc%2Findex.js%3A100%2C12-100%2C21
 * https://codesandbox.io/p/sandbox/react-easy-crop-v69ly910ql?file=%2Fsrc%2Findex.js
 * */
import cld from '@/config/cloudinary.config';
import { IImageFileProps } from '@/types';
import { fileToImgSrc, getCroppedImgBlob, handleScaleImage } from '@/utils/croppedImage';
import { AdvancedImage } from '@cloudinary/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface IDimension {
  w: number;
  h: number;
}

const INIT_CROP: Crop = { unit: 'px', x: 0, y: 0, width: 200, height: 200 };

function ImageInput({ handleFileChange, name, label, className, defaultValue }: IImageFileProps) {
  const [srcUncropped, setSrcUncropped] = useState(null);

  const [crop, setCrop] = useState<Crop>(INIT_CROP);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  // Keep image size same with background element
  const [orginalImg, setOrginalImg] = useState<null | File>(null);
  const [pDimension, setPDimension] = useState<IDimension>({ w: 0, h: 0 });
  const imgCropEl = useRef<HTMLImageElement | null>(null);
  const [scaledImgUrl, setScaledImgUrl] = useState<string | ArrayBuffer | null>(null);

  // Dialog
  const dialogEl = useRef<HTMLDialogElement | null>(null);
  const imageInputEl = useRef<HTMLInputElement>(null);

  const openModal = () => {
    if (dialogEl && dialogEl.current) dialogEl.current.showModal();
  }
  const closeModal = () => {
    if (dialogEl && dialogEl.current) dialogEl.current.close();
  }

  const handleOpenImg = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!imageInputEl.current) return;
    imageInputEl.current.click();
  }

  const handleImgFileChange = async (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      setOrginalImg(inputEl.files[0]);
      setFilename(inputEl.files[0].name);
      if (handleFileChange) handleFileChange(inputEl.files[0]);

      const uploadedImgUrl = await fileToImgSrc(inputEl.files[0]);
      // @ts-ignore
      if (uploadedImgUrl) setSrcUncropped(uploadedImgUrl);

      openModal();
    }
  };



  const handleCropChange = (newCrop: Crop) => {
    // console.log({newCrop});

    setCrop(newCrop); // Update the crop state
  };


  const setCroppedImg = async (updateCrop: Crop) => {
    const cib = await getCroppedImgBlob(scaledImgUrl, updateCrop); // Generate and set the cropped image URL
    if (!cib) return;
    const ciu = URL.createObjectURL(cib);
    if (ciu) setCroppedImageUrl(ciu); // Set the URL of the cropped image
    if(handleFileChange)handleFileChange(cib);
  }


  const onCropComplete = async (newCrop: Crop) => {
    setCrop(newCrop); // Update the crop state
    // console.log({newCrop});
    await setCroppedImg(newCrop);

  };

  const handleConfirmUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
    await setCroppedImg(crop);
  }
  const handleCancelUpload = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
    if (!orginalImg) return;
    const ciu = URL.createObjectURL(orginalImg);
    if (ciu) setCroppedImageUrl(ciu); // Set the URL of the cropped image
    if(handleFileChange)handleFileChange(orginalImg);

  }


  useEffect(() => {
    (async () => {
      if (imgCropEl.current && (imgCropEl.current.clientHeight !== pDimension.h || imgCropEl.current.clientWidth !== pDimension.w) && imgCropEl.current.clientHeight !== 0 && imgCropEl.current.clientWidth !== 0) {
        // console.log({w: imgCropEl.current.clientWidth, h: imgCropEl.current.clientHeight});
        setPDimension({ w: imgCropEl.current.clientWidth, h: imgCropEl.current.clientHeight });
        if (orginalImg) {
          const scaleedImgFile = await handleScaleImage(orginalImg, imgCropEl.current.clientWidth, imgCropEl.current.clientHeight);

          if (scaleedImgFile) {
            setOrginalImg(scaleedImgFile);
            if(handleFileChange)handleFileChange(scaleedImgFile);
            const url = await fileToImgSrc(scaleedImgFile);
            setScaledImgUrl(url);
          }
        }
      }
    })()
  });

  const renderImage = useCallback(() => {
    let imgEl: null | HTMLImageElement | React.ReactNode = null;
    if (!filename || filename === '') {
      if (defaultValue && typeof defaultValue === 'string') {
        imgEl = <AdvancedImage className='w-full object-cover object-center' cldImg={cld.image(defaultValue)} />
      }
    } else {
      if (croppedImageUrl && croppedImageUrl !== '') {
        imgEl = <img src={croppedImageUrl} alt='file-upload' className='w-full' />
      }
    }
    return imgEl;
  }, [filename, defaultValue, croppedImageUrl])


  return (
    <div className={`flex flex-col ${className || ""}`}>
      <label htmlFor={name} className="capitalize text-lg font-semibold mb-1">{label || `Upload ${name}`}</label>
      <div className={`flex items-center gap-4`}>
        <div className="w-full flex justify-between gap-2">
          <div className='w-3/6'>
            {renderImage()}
          </div>
          <div className="btn-text w-full flex flex-col w-3/6 justify-center gap-2">
            {filename && <p>{filename}</p>}
            <button className="w-full bg-yellow-400 text-black p-3 rounded-md font-semibold flex items-center gap-2" onClick={handleOpenImg} >File Upload
              <img src='/icons/upload.svg' alt='upload' className='w-6 svg-black' />
            </button>
          </div>
        </div>
        <input onChange={handleImgFileChange}
          id={name} name={name}
          className="hidden" ref={imageInputEl}
          type="file"
        />
      </div>



      <dialog ref={dialogEl} className='w-10/12'>
        <div className="px-2 flex flex-col items-center justify-center gap-2">
          {srcUncropped && (
            <ReactCrop crop={crop} onChange={handleCropChange} onComplete={onCropComplete} >
              <img id="img-to-crop" src={srcUncropped} alt="file-upload h-32" ref={imgCropEl} />
            </ReactCrop>
          )}
          <div className="buttons w-full flex justify-start items-center gap-x-2">
            <button type='button' onClick={handleConfirmUpload} className="btn-primary">Ok</button>
            <button type='button' onClick={handleCancelUpload} className="btn-danger">Cancel</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default ImageInput;