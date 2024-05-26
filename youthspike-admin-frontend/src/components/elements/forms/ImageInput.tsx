/**
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-with-react-hooks-0h4db
 * https://codesandbox.io/p/sandbox/react-image-crop-demo-s8xr4?file=%2Fsrc%2Findex.js%3A100%2C12-100%2C21
 * https://codesandbox.io/p/sandbox/react-easy-crop-v69ly910ql?file=%2Fsrc%2Findex.js
 * */
import React, { useEffect, useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface IDimension{
  w: number;
  h: number;
}

function ImageInput() {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', x: 0, y: 0, width: 50, height: 50 });
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [image, setImage] = useState(null);
  
  const [orginalImg, setOrginalImg] = useState<null | File>(null);
  const [pDimension, setPDimension] = useState<IDimension>({w: 0, h: 0});
  const imgCropEl = useRef<HTMLImageElement | null>(null);
  const [scaledImg, setScaledImg] = useState<File | null>(null);

  const handleFileChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      setOrginalImg(inputEl.files[0]);
      
      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result));
      reader.readAsDataURL(inputEl.files[0]);
    }
  };



  const handleCropChange = (newCrop) => {
    setCrop(newCrop); // Update the crop state
  };

  async function handleScaleImage(file: File, maxWidth: number, maxHeight: number) {
    return new Promise((resolve, reject) => {
        const scaledImg = new Image();
        scaledImg.onload = function() {
            let width = scaledImg.width;
            let height = scaledImg.height;

            // Calculate the aspect ratio
            const aspectRatio = width / height;
            if (width > maxWidth || height > maxHeight) {
                if (width > height) {
                    // Width is the dominant dimension
                    width = maxWidth;
                    height = maxWidth / aspectRatio;
                } else {
                    // Height is the dominant dimension
                    height = maxHeight;
                    width = maxHeight * aspectRatio;
                }
            }

            // Create a canvas to draw the resized image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(scaledImg, 0, 0, width, height);

            // Convert the canvas content to a Blob
            canvas.toBlob(function(blob) {
                if (blob) {
                    // Create a new file from the Blob
                    const resizedFile = new File([blob], 'resized-image.jpg', { type: 'image/jpeg' });
                    resolve(resizedFile);
                } else {
                    reject(new Error('Canvas to Blob conversion failed.'));
                }
            }, 'image/jpeg');
        };
        scaledImg.onerror = function() {
            reject(new Error('Image loading failed.'));
        };
        scaledImg.src = URL.createObjectURL(file);
    });
}


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

  useEffect(() => {
    if (src) {
      const img = new Image();
      img.onload = () => {
        setImage(img); // Set the loaded image
      };
      img.src = src;
    }
  }, [src]);

  useEffect(()=>{
    (async ()=>{
      if(imgCropEl.current && (imgCropEl.current.clientHeight !== pDimension.h || imgCropEl.current.clientWidth !== pDimension.w)){
        // console.log({w: imgCropEl.current.clientWidth, h: imgCropEl.current.clientHeight});
        setPDimension({w: imgCropEl.current.clientWidth, h: imgCropEl.current.clientHeight});
        if(orginalImg){
          const scaleedImgFile = await handleScaleImage(orginalImg, imgCropEl.current.clientWidth, imgCropEl.current.clientHeight);
          console.log({scaleedImgFile});
          
          if(scaleedImgFile) {
            setScaledImg(scaleedImgFile);
            setOrginalImg(scaleedImgFile);
          }
        }
      }
    })()
  });


  return (
    <div className="w-full">
      <div>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      {src && (
        <ReactCrop crop={crop} onChange={handleCropChange} onComplete={onCropComplete} >
          <img id="img-to-crop" src={src} alt="file-upload w-full" ref={imgCropEl} />
        </ReactCrop>
      )}
      {croppedImageUrl && (
        <div className="img-wraper w-full flex items-center justify-center">
          <img
            alt="Crop"
            className='h-32 mt-4'
            src={croppedImageUrl}
          />
        </div>
      )}

      {scaledImg && (
        <img src={scaledImg} alt="Scaled-Img" />
      )}
    </div>
  );
}

export default ImageInput;
