import { cloudinary } from '../config/cloudinary';

export async function uploadImageBuffer(buffer: Buffer, folder = 'goldsmith-records'): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
      if (error || !result) {
        reject(error || new Error('Cloudinary upload failed'));
        return;
      }
      resolve(result.secure_url);
    });

    stream.end(buffer);
  });
}
