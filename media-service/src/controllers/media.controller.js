import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Media } from "../model/media.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { logger } from "../utils/logger.js";

export const uploadMedia = asyncHandler(async (req, res) => {
  logger.info("Starting media file upload...");

  if (!req.file) {
    logger.error("No file found. Please add a file and try again");
    throw new ApiError(400, "File not found, please add a file and try again");
  }

  const { originalname, mimetype } = req.file;
  const userId = req.user.userId;

  logger.info(`File Details: name:${originalname}, type: ${mimetype}`);
  logger.info(`Upload on Cloudinary Starting...`);

  const uploadfile = await uploadOnCloudinary(req.file);

  logger.info(
    `Cloudinary uploaded successfull. Public Id: ${uploadfile.public_id}`
  );

  const newMedia = await Media.create({
    publicId: uploadfile.public_id,
    originalName: originalname,
    mimetype,
    url: uploadfile.secure_url,
    userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "New Media Uploaded successfully", newMedia));
});

export const getMedia = asyncHandler(async (req, res) => {
  const result = await Media.find({});

  if (result.length <= 0 || !result) {
    throw new ApiError(400, "No media found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "All media fetched successfully"));
});
