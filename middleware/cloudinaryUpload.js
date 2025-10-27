import streamifier from "streamifier";
import cloudinary from "../cloudinaryConfig.js";

export const uploadToCloudinary = (req, res, next) => {
  if (!req.file) return next(); 

  const stream = cloudinary.uploader.upload_stream(
    { folder: "google-photos-clone" },
    (error, result) => {
      if (result) {
        req.file.cloudinaryUrl = result.secure_url;
        req.file.cloudinaryId = result.public_id;
        next();
      } else {
        next(error);
      }
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(stream);
};
