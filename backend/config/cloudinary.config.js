import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/////////////////////////
// Multer setup (disk storage)
/////////////////////////

// Ensure upload folder exists
const uploadPath = path.join(process.cwd(), "upload");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"), false);
  }
};

export const multerMiddleWare = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
}).single("media");

/////////////////////////
// Upload file to Cloudinary from disk
/////////////////////////
export const uploadFileToCloudinary = async (file) => {
  if (!file) throw new Error("No file provided");

  try {
    const isVideo = file.mimetype.startsWith("video");
    const options = { resource_type: isVideo ? "video" : "image" };

    // Upload from disk
    const result = await cloudinary.uploader.upload(file.path, options);

    // Delete local file after successful upload
    fs.unlinkSync(file.path);

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    // Delete temp file if exists
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return null;
  }
};
