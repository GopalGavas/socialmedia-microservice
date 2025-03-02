import { Search } from "../model/search.model.js";
import { logger } from "../utils/logger.js";

export const handlePostCreated = async (event) => {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();
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
    logger.info(`Search post Deleted: ${event.postId}`);
  } catch (error) {
    logger.error(error, "Error handling post deletion event");
  }
};
