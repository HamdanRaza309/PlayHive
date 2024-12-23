import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {

        // Upload file on cloudinary
        const res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        // File taken from LocalStorage and uploaded successfully to Cloudinary
        console.log('File uploaded successfully to Cloudinary:', res.url);
        return res;
    } catch (error) {

        // remove the locally saved temporary file as the upload operation got failed
        await fs.unlink(localFilePath);
        console.log('File upload failed and local file removed from local storage.');

        return null;
    }
};

export { uploadFileOnCloudinary }
