import { Router } from "express";
import multer, { memoryStorage, MulterError } from "multer";
import { authenticateRequest } from "../middlewares/auth.middleware.js";
import { ApiError } from "../utils/apiError.js";
import { getMedia, uploadMedia } from "../controllers/media.controller.js";

const router = Router();

const upload = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.route("/upload").post(
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof MulterError) {
        return next(
          new ApiError(400, err.message || "Multer error while uploading")
        );
      } else if (err) {
        return next(
          new ApiError(
            400,
            err.message || "Unknown error occured while uploading"
          )
        );
      }

      if (!req.file) {
        return next(new ApiError(400, "file not found"));
      }

      next();
    });
  },
  uploadMedia
);

router.route("/").get(authenticateRequest, getMedia);

export default router;
