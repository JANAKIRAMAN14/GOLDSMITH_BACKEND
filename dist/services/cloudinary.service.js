"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageBuffer = uploadImageBuffer;
const cloudinary_1 = require("../config/cloudinary");
async function uploadImageBuffer(buffer, folder = 'goldsmith-records') {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
            if (error || !result) {
                reject(error || new Error('Cloudinary upload failed'));
                return;
            }
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
}
