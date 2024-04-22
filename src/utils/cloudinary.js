import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'



const uploadOnCloudinary = async (localFilePath) => {

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        if (!localFilePath) return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file has been uploaded successfully
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        // remove the locally saved temporary files
        fs.unlinkSync(localFilePath)

        // upload operation got failed 
        console.log('ERROR from cloudinary', error);
        return null;
    }
}

export { uploadOnCloudinary }