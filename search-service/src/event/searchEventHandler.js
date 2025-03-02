import { Search } from "../model/search.model.js";
import { logger } from "../utils/logger.js";
import { redisClient } from "../database/redisClient.js";

const invalidateSearchCache = async () => {
  try {
    const keys = await redisClient.keys("search:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.warn("Error while invalidating the cache: ", error.message);
  }
};

export const handlePostCreated = async (event) => {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();
    await invalidateSearchCache();
    logger.info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`
    );
  } catch (error) {
    logger.error(error, "Error handling post creation event");
  }
};

export const handlePostDeleted = async (event) => {
  try {
    await Search.findOneAndDelete({ postId: event.postId });
    await invalidateSearchCache();
    logger.info(`Search post Deleted: ${event.postId}`);
  } catch (error) {
    logger.error(error, "Error handling post deletion event");
  }
};
