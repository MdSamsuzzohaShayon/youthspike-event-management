// https://chat.openai.com/c/ff62b374-21b1-4012-9d70-800e4dfd199b

import { Injectable } from '@nestjs/common';
import { createReadStream as fsCreateReadStream } from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { unlink } from 'fs/promises';
import { ConfigService } from '@nestjs/config';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
const GraphQLUpload = GraphQLUploadModule.default;

type SponsorType = {
  company: string;
  logo: string;
};

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Load Cloudinary config from environment variables
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_API_CLOUD'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFiles(files: Promise<FileUpload>, w = 300, h = 300): Promise<string> {
    const { createReadStream, filename } = await files;

    try {
      const stream = createReadStream();

      // ✅ Upload using stream (correct way)
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: this.configService.get('CLOUDINARY_API_FOLDER'),
            transformation: [
              { width: w, height: h, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        stream.pipe(uploadStream); // 👈 direct pipe (BEST)
      });

      return result.public_id; // ✅ now works
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async uploadSponsors(files: Promise<FileUpload>, company: string, w = 300, h = 300): Promise<SponsorType | null> {
    const { createReadStream, filename, mimetype } = await files;
    try {
      const stream = createReadStream();


      // Upload the file to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: this.configService.get('CLOUDINARY_API_FOLDER'),
            transformation: [
              { width: w, height: h, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        stream.pipe(uploadStream); // 👈 direct pipe (BEST)
      });

      return { company, logo: result.public_id };
    } catch (error) {
      return null;
    }
  }
}
