import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises'; // Use fs/promises for Promise-based methods
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        // Upload file to Cloudinary
        const res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        // Log success and return response
        console.log('File uploaded successfully to Cloudinary:', res.url);
        return res;
    } catch (error) {
        console.error('Cloudinary upload error:', error);

        // Remove the temporary local file
        try {
            await fs.unlink(localFilePath);
            console.log('Local temporary file removed successfully.');
        } catch (unlinkError) {
            console.error('Error removing local temporary file:', unlinkError);
        }

        return null;
    }
};

export { uploadFileOnCloudinary };
