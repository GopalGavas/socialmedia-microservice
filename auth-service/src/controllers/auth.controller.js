import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { logger } from "../utils/logger.js";
import { validateRegistration, validateLogin } from "../utils/validation.js";
import jwt from "jsonwebtoken";

const generateRefreshAndAccessToken = async (userId) => {
  const user = await User.findById(userId);
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      400,
      error.message || "Failed to generate access and refresh token"
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  logger.info("Registration endpoint hit...");

  const { error } = validateRegistration(req.body);
  if (error) {
    logger.warn("Validation error", error.details[0].message);
    throw new ApiError(400, error.details[0].message);
  }

  const { username, email, password } = req.body;

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (user) {
    throw new ApiError(400, "User already exists");
  }

  const newUser = await User.create({
    username,
    email,
    password,
  });

  if (!newUser) {
    logger.warn("Registration error occured");
    throw new ApiError(500, "Internal server Error");
  }

  logger.info("User created successfully");

  return res
    .status(200)
    .json(new ApiResponse(200, newUser, "User created Successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  logger.info("Login endpoint hit");

  const { error } = validateLogin(req.body);
  if (error) {
    logger.warn("Validation error", error.details[0].message);
    throw new ApiError(400, error, error.details[0].message);
  }

  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "Provide email or username");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    logger.warn("User does not exists");
    throw new ApiError(400, "User with provided email does not exist");
  }

  const validPassword = await user.isPasswordCorrect(password);
  if (!validPassword) {
    logger.warn("Invalid Password");
    throw new ApiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
    user._id
  );

  user.refreshToken = refreshToken;
  await user.save();

  logger.info("User logged In successfully");

  user.refreshToken = undefined;
  user.password = undefined;

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "User LoggedIn successfully"
      )
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  logger.info("refresh access token endpoint hit...");
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    logger.warn("no incoming refresh Token found, unauthorized request");
    throw new ApiError(403, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      logger.warn("Invalid refresh Token");
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      logger.warn("Invalid refreshToken or is expired or used");
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
      user?._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    logger.info("Access Token refreshed successfully");

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken: accessToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  logger.info("Logout Endpoint here");
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  logger.info("User logged out");

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});
