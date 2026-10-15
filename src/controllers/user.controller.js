import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh & access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  if (!fullName || !username || !email || !password)
    throw new ApiError(400, "All fields are required");

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) throw new ApiError(409, "Username or email already exists");

  const user = await User.create({
    fullName,
    username,
    email,
    password,
  });

  const createdUser = {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if ((!username && !email) || !password)
    throw new ApiError(400, "All fields are required");
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid login credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, authCookieOptions)
    .cookie("refreshToken", refreshToken, authCookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "User logged in Successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: {
      refreshToken: 1,
    },
  });
  return res
    .status(200)
    .clearCookie("accessToken", authCookieOptions)
    .clearCookie("refreshToken", authCookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // Step 1: Get the refresh token
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Step 2: Verify the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    // Step 3: Find the user in the database
    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Step 4: Compare with the stored refresh token
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Step 5: Generate new tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id,
    );

    // Send the new tokens
    return res
      .status(200)
      .cookie("accessToken", accessToken, authCookieOptions)
      .cookie("refreshToken", refreshToken, authCookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  //After verifyJWT runs, the controller can access the authenticated user's details through req.user. We don't need to query MongoDB again just to retrieve that same user.
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;
  const user = req.user;
  const updateFields = {};
  if (fullName && fullName.trim() !== "")
    updateFields.fullName = fullName.trim();
  if (email && email.trim() !== "") updateFields.email = email.trim();
  if (username && username.trim() !== "")
    updateFields.username = username.trim();

  if (Object.keys(updateFields).length === 0)
    throw new ApiError(400, "At least one field is required");

  const options = {
    new: true,
    runValidators: true,
  };

  if (email || username) {
    const conditions = [];

    if (email) conditions.push({ email: email.trim() });
    if (username) conditions.push({ username: username.trim() });

    const existingUser = await User.findOne({
      $or: conditions,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw new ApiError(409, "Email or username already exists");
    }
  }

  const finalUser = await User.findByIdAndUpdate(
    user._id,
    updateFields,
    options,
  ).select("-password -refreshToken");

  if (!finalUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, finalUser, "Account details updated successfully"),
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) throw new ApiError(400, "No temporary file found");

  const uploadedAvatar = await uploadOnCloudinary(filePath);
  if (!uploadedAvatar) throw new ApiError(500, "File not uploaded");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: uploadedAvatar.secure_url },
    {
      new: true,
      runValidators: true,
    },
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully!!"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
};
