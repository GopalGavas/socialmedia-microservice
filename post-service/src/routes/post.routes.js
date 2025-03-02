import { Router } from "express";
import {
  createPost,
  deletePostById,
  getAllPosts,
  getPostById,
  updatePostById,
} from "../controllers/post.controller.js";
import { authenticateRequest } from "../middlewares/auth.middleware.js";
import {
  writeOperationsLimiter,
  readOperationsLimiter,
  deleteOperationsLimiter,
} from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.use(authenticateRequest);

router.route("/create").post(writeOperationsLimiter, createPost);
router.route("/all-posts").get(readOperationsLimiter, getAllPosts);
router
  .route("/:postId")
  .get(readOperationsLimiter, getPostById)
  .delete(deleteOperationsLimiter, deletePostById)
  .put(writeOperationsLimiter, updatePostById);

export default router;
