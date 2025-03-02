import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";
import { Search } from "../model/search.model.js";

export const handleSearch = asyncHandler(async (req, res) => {
  logger.info("Handle Search Endpoint hit...");

  const { query } = req.query;

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

  return res
    .status(200)
    .json(new ApiResponse(200, results, "Search results fetched successfully"));
});
