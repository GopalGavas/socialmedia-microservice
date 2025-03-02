import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";
import { Search } from "../model/search.model.js";

export const handleSearch = asyncHandler(async (req, res) => {
  logger.info("Handle Search Endpoint hit...");

  const { query } = req.query;

  const cacheKey = `search:${query}`;
  let cachedPost;

  try {
    cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "Search Result fetched from Cache successfully",
            JSON.parse(cachedPost)
          )
        );
    }
  } catch (redisError) {
    logger.error(`redis error!, caching failed: ${redisError.message}`);
  }

  const results = await Search.find(
    {
      $text: { $search: query },
    },
    {
      score: { $meta: "textScore" },
    }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(10);

  if (!results) {
    throw new ApiError(404, "Can't fetch search Results");
  }

  try {
    await req.redisClient.set(cacheKey, JSON.stringify(results), "EX", 300);
  } catch (redisError) {
    logger.error(`failed to save posts in cache: ${redisError.message}`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, results, "Search results fetched successfully"));
});
