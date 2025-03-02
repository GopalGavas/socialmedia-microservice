import { Search } from "../model/search.model.js";
import { logger } from "../utils/logger.js";

export const handleSearchPost = async (event) => {
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
