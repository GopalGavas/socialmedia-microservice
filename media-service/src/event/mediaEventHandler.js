import { Media } from "../model/media.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { logger } from "../utils/logger.js";

export const handlerPostDeleted = async (event) => {
  console.log(event);
  const { postId, mediaIds } = event;
  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    for (const media of mediaToDelete) {
      await deleteFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);

      logger.info(
        `Deleted Media: ${media._id}, associated with Deleted Post: ${postId}`
      );
    }

    logger.info(
      `Deletion process of media for post: ${postId} completed successfully`
    );
  } catch (error) {
    logger.error(`Could not delete media assoicated with the post: ${error}`);
  }
};
