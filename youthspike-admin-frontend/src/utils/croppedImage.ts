import { Crop } from 'react-image-crop';

const MAX_OUTPUT_WIDTH = 800; // Maximum width for the cropped image
const MAX_OUTPUT_HEIGHT = 800; // Maximum height for the cropped image

function croppedImage(image, crop: Crop, fileName: string) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        // reject(new Error('Canvas is empty'));
        console.error('Canvas is empty');
        return;
      }
      blob.name = fileName;
      window.URL.revokeObjectURL(this.fileUrl);
      this.fileUrl = window.URL.createObjectURL(blob);
      resolve(this.fileUrl);
    }, 'image/jpeg');
  });
}

export default croppedImage;
