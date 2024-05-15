/**
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-with-react-hooks-0h4db
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-s8xr4?file=%2Fsrc%2Findex.js%3A100%2C12-100%2C21
 * https://codesandbox.io/p/sandbox/react-easy-crop-v69ly910ql?file=%2Fsrc%2Findex.js
 * */
import React, { useEffect, useRef, useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function ImageInput() {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', x: 0, y: 0, width: 50, height: 50 });
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [image, setImage] = useState(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (src) {
      const img = new Image();
      img.onload = () => {
        setImage(img); // Set the loaded image
      };
      img.src = src;
    }
  }, [src]);

  const handleCropChange = (newCrop) => {
    setCrop(newCrop); // Update the crop state
  };

  const getCroppedImg = async () => {
    if (!image || !crop.width || !crop.height) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    // Draw the cropped image on the canvas
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          reject(new Error('Failed to crop image.'));
          return;
        }
        blob.name = 'cropped-image.jpeg';
        setCroppedImageUrl(URL.createObjectURL(blob)); // Set the URL of the cropped image
        resolve();
      }, 'image/jpeg');
    });
  };

  const onCropComplete = async (newCrop) => {
    setCrop(newCrop); // Update the crop state
    await getCroppedImg(); // Generate and set the cropped image URL
  };

  return (
    <div className="w-full">
      <div>
        <input type="file" accept="image/*" onChange={onSelectFile} />
      </div>
      {src && (
        <ReactCrop crop={crop} onChange={handleCropChange} onComplete={onCropComplete}>
          <img id="img-to-crop" src={src} alt="file-upload w-full" />
        </ReactCrop>
      )}
      {croppedImageUrl && (
        <img
          alt="Crop"
          style={{
            maxWidth: '100%',
            height: 'auto', // Maintain aspect ratio
            display: 'block', // Prevent inline white space
            margin: '0 auto', // Center align horizontally
          }}
          src={croppedImageUrl}
        />
      )}
    </div>
  );
}

export default ImageInput;
