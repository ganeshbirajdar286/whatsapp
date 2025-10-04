import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/////////////////////////
// Upload file to Cloudinary
/////////////////////////
export const uploadFileToCloudinary = async (file) => {
  try {
    const isVideo = file.mimetype.startsWith("video");

    const options = {
      resource_type: isVideo ? "video" : "image",
    };

    const uploader = isVideo
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;

    const result = await uploader(file.path, options);

    // remove temp file after successful upload
    fs.unlinkSync(file.path);

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    // remove temp file if exists
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return null;
  }
};

/////////////////////////
// Multer setup         
/////////////////////////
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  }, 
});



export const multerMiddleWare = multer({ storage, limits: { fileSize: 40 * 1024 * 1024 }, }).single("media");
