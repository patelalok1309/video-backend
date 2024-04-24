import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import { ApiError } from './ApiError.js';



const uploadOnCloudinary = async (localFilePath) => {

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        if (!localFilePath) return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,
            {
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

const uploadVideoOnCloudinary = async (localFilePath) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    })

    try {
        var metadata;
        if (!localFilePath) return null;

        const response = await cloudinary.uploader
            .upload(localFilePath,
                {
                    resource_type: "video",
                    eager: [
                        { width: 300, height: 300, crop: "pad", audio_codec: "none" },
                        { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" }],
                    eager_async: true,
                })
            .then(result => {
                metadata = result
                console.log("result : ", result)
            })
            .catch((err) => console.error(err));


        fs.unlinkSync(localFilePath)
        return  metadata ;

    } catch (err) {
        // remove the locally saved temporary files
        fs.unlinkSync(localFilePath)

        // upload operation got failed 
        console.log('ERROR from cloudinary', err);
        return null;
    }


}


const unlinkFromCloudinary = async (cloudinaryURL , type = 'image') => {

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {

        if (!cloudinaryURL) {
            throw new ApiError(404, "Avatar url not found")
        }

        const public_id = cloudinaryURL.split('upload')[1].split('/')[2].split('.')[0];

        await cloudinary.uploader.destroy(public_id , {resource_type : type})
            .then((result) => {
                if (result !== 'ok') return false;
            })
            .catch(err => console.error(err))

        return true;

    } catch (error) {
        console.log('error while destroying asset of cloudinary', error)
    }
}

export { uploadOnCloudinary, unlinkFromCloudinary, uploadVideoOnCloudinary }