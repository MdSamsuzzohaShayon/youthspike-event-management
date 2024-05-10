/**
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-with-react-hooks-0h4db
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-s8xr4?file=%2Fsrc%2Findex.js%3A100%2C12-100%2C21
 */

import { IFileFileProps } from "@/types";
import React, { useState, useRef } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const ImageInput = (props: IFileFileProps) => {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ aspect: 1 });
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const imageRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setSrc(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoaded = (image) => {
    imageRef.current = image;
  };

  const onCropComplete = (crop) => {
    makeClientCrop(crop);
  };

  const makeClientCrop = async (crop) => {
    if (imageRef.current && crop.width && crop.height) {
      const croppedImageUrl = await getCroppedImg(imageRef.current, crop, "newFile.jpeg");
      setCroppedImageUrl(croppedImageUrl);
    }
  };

  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          return;
        }
        blob.name = fileName;
        resolve(window.URL.createObjectURL(blob));
      }, "image/jpeg");
    });
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
        {src && (
          <ReactCrop
            src={src}
            crop={crop}
            ruleOfThirds
            onImageLoaded={onImageLoaded}
            onComplete={onCropComplete}
            onChange={(newCrop) => setCrop(newCrop)}
          />
        )}
      </div>

      {croppedImageUrl && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Cropped Image Preview</h2>
          <img alt="Crop" className="max-w-full h-auto" src={croppedImageUrl} />
        </div>
      )}

      <div className="w-full">
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="hidden"
          id="imageInput"
        />
        <label
          htmlFor="imageInput"
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
        >
          Choose Image
        </label>
      </div>
    </div>
  );
};

export default ImageInput;
