// https://chat.openai.com/c/ff62b374-21b1-4012-9d70-800e4dfd199b

import { Injectable } from '@nestjs/common';
import * as Upload from 'graphql-upload/Upload.js';
import fs, { createWriteStream } from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { unlink } from 'fs/promises';
import { ConfigService } from '@nestjs/config';

type SponsorType = {
  company: string,
  logo: string
}

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Load Cloudinary config from environment variables
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_API_CLOUD', { infer: true }),
      api_key: this.configService.get('CLOUDINARY_API_KEY', { infer: true }),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET', { infer: true }),
    });
  }

  async uploadFiles(files: Upload, w = 300, h = 300): Promise<string> {
    const { createReadStream, filename, mimetype, encoding } = await files;
    try {
      const localPath = `./uploads/${filename}`;
      const stream = createReadStream();
      const uploadFilesToServer = new Promise((resolve, reject) =>
        stream
          .pipe(createWriteStream(localPath))
          .on('finish', () => resolve(true))
          .on('error', () => reject(false)),
      );

      await uploadFilesToServer;

      // Upload the file to Cloudinary
      const cloudinaryResponse = await cloudinary.uploader.upload(localPath, {
        folder: this.configService.get('CLOUDINARY_API_FOLDER', {
          infer: true,
        }),
        transformation: {
          width: w,
          height: h,
          crop: 'limit',
        },
      });

      await unlink(localPath);
      return cloudinaryResponse.public_id;
    } catch (error) {
      return null;
    }
  }

  async uploadSponsors(files: Upload, company: string, w = 300, h = 300): Promise<SponsorType | null> {
    const { createReadStream, filename, mimetype, encoding } = await files;
    try {
      const localPath = `./uploads/${filename}`;
      const stream = createReadStream();
      const uploadFilesToServer = new Promise((resolve, reject) =>
        stream
          .pipe(createWriteStream(localPath))
          .on('finish', () => resolve(true))
          .on('error', () => reject(false)),
      );

      await uploadFilesToServer;

      // Upload the file to Cloudinary
      const cloudinaryResponse = await cloudinary.uploader.upload(localPath, {
        folder: this.configService.get('CLOUDINARY_API_FOLDER', {
          infer: true,
        }),
        transformation: {
          width: w,
          height: h,
          crop: 'limit',
        },
      });

      await unlink(localPath);
      return {company, logo: cloudinaryResponse.public_id};
    } catch (error) {
      return null;
    }
  }
}
