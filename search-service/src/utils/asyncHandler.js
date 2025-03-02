import Joi from "joi";

export const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
    try {
      await Promise.resolve(requestHandler(req, res, next));
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: error.details.map((err) => err.message),
        });
      }

      return next(error);
    }
  };
};
