import { Crop } from 'react-image-crop';

const MAX_OUTPUT_WIDTH = 800; // Maximum width for the cropped image
const MAX_OUTPUT_HEIGHT = 800; // Maximum height for the cropped image

const croppedImage = (
    imgSrc: string,
    crop: Crop,
    fileName: string,
    quality: number = 1.0 // Use 1.0 for maximum quality (no compression)
): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = imgSrc;

        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Failed to create canvas context'));
                return;
            }

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            // Calculate actual dimensions of the cropped image
            const croppedWidth = Math.min(MAX_OUTPUT_WIDTH, crop.width * scaleX);
            const croppedHeight = Math.min(MAX_OUTPUT_HEIGHT, crop.height * scaleY);

            canvas.width = croppedWidth;
            canvas.height = croppedHeight;

            // Calculate the source rectangle based on the crop and scale
            const sourceX = crop.x * scaleX;
            const sourceY = crop.y * scaleY;
            const sourceWidth = crop.width * scaleX;
            const sourceHeight = crop.height * scaleY;

            // Calculate destination rectangle to maintain aspect ratio
            const destWidth = canvas.width;
            const destHeight = (sourceHeight / sourceWidth) * destWidth;

            const destX = 0;
            const destY = (canvas.height - destHeight) / 2;

            // Draw the cropped image onto the canvas
            ctx.drawImage(
                image,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                destX,
                destY,
                destWidth,
                destHeight
            );

            // Convert canvas content to blob with specified quality
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create blob'));
                        return;
                    }

                    // Create a File object from the blob
                    const file = new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });

                    resolve(file);
                },
                'image/jpeg',
                quality
            );
        };

        image.onerror = (error) => {
            reject(error);
        };
    });
};

export default croppedImage;
