import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger.js";
import { ApiError } from "./apiError.js";

cloudinary.config({
  cloud_name: `${process.env.CLOUD_NAME}`,
  api_key: `${process.env.API_KEY}`,
  api_secret: `${process.env.API_SECRET}`,
});

export const uploadOnCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error(`Error while uploading on cloudinary ${error}`);
          reject(
            new ApiError(500, error.message || "Cloudinary upload failed")
          );
        } else {
          logger.info(
            `files successfully uploaded to cloudinary: ${result.public_id}`
          );
          resolve(result);
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (
  publicId,
  resource_type = "image"
) => {
  try {
    if (!publicId) return null;

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: `${resource_type}`,
    });

    logger.info(`Media successfully deleted from cloudinary: ${publicId}`);
    return response;
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleteing from cloudinary"
    );
  }
};
