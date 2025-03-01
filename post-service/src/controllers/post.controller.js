import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../model/post.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";
import { validateCreatePost, validateUpdatePost } from "../utils/validation.js";
import { isValidObjectId } from "mongoose";
import { publishEvent } from "../utils/rabbitmq.js";

const invalidatePostCache = async (req, input) => {
  try {
    const cachedKey = `post:${input}`;
    await req.redisClient.del(cachedKey);

    const keys = await req.redisClient.keys("posts:*");
    if (keys.length > 0) {
      await req.redisClient.del(keys);
    }
  } catch (error) {
    logger.warn("Error while invalidating cache", error.message);
  }
};

export const createPost = asyncHandler(async (req, res) => {
  logger.info("... create post endpoint hit");

  const { error } = validateCreatePost(req.body);
  if (error) {
    logger.warn("Validation error", error.details[0].message);
    throw new ApiError(400, error.details[0].message);
  }

  const { content, mediaIds } = req.body;

  const newlyCreatedPost = await Post.create({
    user: req.user.userId,
    content,
    mediaIds: mediaIds || [],
  });

  if (!newlyCreatedPost) {
    throw new ApiError(
      500,
      "Internal server error, something went wrong while creating new Post"
    );
  }

  await newlyCreatedPost.save();
  await invalidatePostCache(req, newlyCreatedPost._id.toString());

  logger.info("Post created successfully");

  return res
    .status(201)
    .json(new ApiResponse(201, newlyCreatedPost, "Post created successfully"));
});

export const updatePostById = asyncHandler(async (req, res) => {
  logger.info("Update post endpoint hit...");

  const { error } = validateUpdatePost(req.body);

  if (error) {
    logger.warn("Validation error", error.details[0].message);
    throw new ApiError(400, error.details[0].message);
  }

  const { postId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(postId)) {
    logger.error("Invalid post Id provided");
    throw new ApiError(400, "Enter valid Post Id");
  }

  const updatePost = await Post.findOneAndUpdate(
    {
      _id: postId,
      user: req.user.userId,
    },
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatePost) {
    logger.error("Post with provided Id does not exist");
    throw new ApiError(404, "Post not found");
  }

  await invalidatePostCache(req, postId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Post updated successfully", updatePost));
});

export const getAllPosts = asyncHandler(async (req, res) => {
  logger.info("get all posts endpoint hit....");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  const cacheKey = `posts:${page}:${limit}`;
  let cachedPosts;

  try {
    cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(
        new ApiResponse(
          200,
          "Posts retrieved from cache",
          JSON.parse(cachedPosts)
        )
      );
    }
  } catch (redisError) {
    logger.warn("redis error , caching failed: ", redisError.message);
  }

  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const totalNoOfPosts = await Post.countDocuments();

  const result = {
    posts,
    currentPage: page,
    totalPages: Math.ceil(totalNoOfPosts / limit),
    totalPosts: totalNoOfPosts,
  };

  // "save your posts in redis cache"
  try {
    await req.redisClient.set(cacheKey, JSON.stringify(result), "EX", 300);
  } catch (redisError) {
    logger.warn("Failed to save posts in cache", redisError.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Posts retrieved successfully", result));
});

export const getPostById = asyncHandler(async (req, res) => {
  logger.info("Get post by Id endpoint hit...");

  const { postId } = req.params;

  if (!isValidObjectId(postId)) {
    logger.error("Invalid post Id provided");
    throw new ApiError(400, "Enter valid Post Id");
  }

  const cacheKey = `post:${postId}`;
  let cachedPost;

  try {
    cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "Post retrieved succesfully from cache",
            JSON.parse(cachedPost)
          )
        );
    }
  } catch (redisError) {
    logger.warn("Redis error, caching failed: ", redisError);
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // "save in cache"
  try {
    await req.redisClient.set(cacheKey, JSON.stringify(post), "EX", 300);
  } catch (redisError) {
    logger.warn("Redis error, failed to save post in cache", redisError);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Post retireved successfully", post));
});

export const deletePostById = asyncHandler(async (req, res) => {
  logger.info("Delete post endpoint hit...");

  const { postId } = req.params;

  if (!isValidObjectId(postId)) {
    logger.error("Invalid post Id provided");
    throw new ApiError(400, "Enter valid Post Id");
  }

  const deletePost = await Post.findOneAndDelete({
    _id: postId,
    user: req.user.userId,
  });

  if (!deletePost) {
    logger.error("Post does not exists");
    throw new ApiError(404, "Post not found");
  }

  // "PUBLISH POST DELETE METHOD"
  await publishEvent("post-deleted", {
    postId: deletePost._id.toString(),
    userId: req.user.userId,
    mediaIds: deletePost.mediaIds,
  });

  await invalidatePostCache(req, postId);

  logger.info("Post deleted successfully");
  return res
    .status(200)
    .json(new ApiResponse(200, { success: true }, "Post deleted successfully"));
});
