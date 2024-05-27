import { Crop } from "react-image-crop";

export const fileToImgSrc = (imgFile: File): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    if (!imgFile) reject("No file has been provided!");

    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      reject(error);
    }
    reader.readAsDataURL(imgFile);
  });
}

export const urlToImgFile = (imgUrl: string | ArrayBuffer | null) => {
  return new Promise((resolve, reject) => {
    if (!imgUrl) {
      reject("No url has been proivided!");
    } else{
      const newImg = new Image();
      newImg.onload = () => {
        resolve(newImg);
      }
      newImg.onerror = (error) => {
        reject(error);
      }
      newImg.src = imgUrl;
    }

  });
}

export async function handleScaleImage(file: File, maxWidth: number, maxHeight: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const scaledImg = new Image();
    scaledImg.onload = function () {
      let width = scaledImg.width;
      let height = scaledImg.height;

      // Log original dimensions
      console.log(`Original image dimensions: ${width}x${height}`);

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

      // Log new dimensions
      console.log(`Resized image dimensions: ${width}x${height}`);

      // Create a canvas to draw the resized image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Context can not be created!"));
      } else {
        ctx.drawImage(scaledImg, 0, 0, width, height);

        // Check if the canvas is tainted
        try {
          ctx.getImageData(0, 0, width, height);
        } catch (e) {
          reject(new Error('Canvas is tainted, possibly due to CORS issue.'));
          return;
        }

        // Convert the canvas content to a Blob
        canvas.toBlob(function (blob) {
          if (blob) {
            // Create a new file from the Blob
            const resizedFile = new File([blob], 'resized-image.jpg', { type: 'image/jpeg' });
            resolve(resizedFile);
          } else {
            reject(new Error('Canvas to Blob conversion failed.'));
          }
        }, 'image/jpeg');
      }
    };
    scaledImg.onerror = function () {
      reject(new Error('Image loading failed.'));
    };
    scaledImg.src = URL.createObjectURL(file);
  });
}





export const getCroppedImgBlob = async (scaledImgUrl: string | ArrayBuffer | null, crop: Crop): Promise<Blob | MediaSource | null> => {
  if (!scaledImgUrl || !crop.width || !crop.height) {
    return null;
  }

  const newImg = await urlToImgFile(scaledImgUrl);

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  // Draw the cropped image on the canvas
  ctx.drawImage(
    newImg,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  // Convert canvas to blob and return the image URL
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        reject(new Error('Failed to crop image.'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg');
  });
};
