import Compressor from 'compressorjs';
import { MAX_FILE_SIZE_BYTES } from './constant';

async function compressImageIfNeeded(file: Blob): Promise<Blob> {
    const imageFile =
        file instanceof File
            ? file
            : new File([file], 'image.jpg', {
                type: file.type || 'image/jpeg',
            });

    // Only compress if > 10 MB
    const isLarge = imageFile.size > MAX_FILE_SIZE_BYTES;  // 5 * 1024 * 1024;

    if (!isLarge) {
        return imageFile;
    }

    return new Promise((resolve, reject) => {
        new Compressor(imageFile, {
            quality: 0.7,

            // Resize large images
            maxWidth: 1600,
            maxHeight: 1600,

            // Convert to modern format
            mimeType: 'image/webp',

            // Enable multi-threading when possible
            convertSize: 0,

            success(result) {
                resolve(result);
            },

            error(err) {
                reject(err);
            },
        });
    });
}

export default compressImageIfNeeded;