import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {
  deleteFromCloudinary,
  removeTempFile,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { readFile } from "node:fs/promises";

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};
const MIN_PASSWORD_LENGTH = 8;

const verifyLogoutCredential = (token, secret) => {
  if (!token) return null;

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return null;
    throw error;
  }
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
  if (typeof password !== "string")
    throw new ApiError(400, "Password must be a string");
  if (password.length < MIN_PASSWORD_LENGTH)
    throw new ApiError(
      400,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    );

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
  if (!user) throw new ApiError(401, "Invalid login credentials");

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
        },
        "User logged in Successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  const incomingRefreshToken = req.cookies?.refreshToken;
  const decodedAccessToken = verifyLogoutCredential(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET,
  );
  const decodedRefreshToken = verifyLogoutCredential(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );
  const accessUserId = decodedAccessToken?._id
    ? String(decodedAccessToken._id)
    : null;
  const refreshUserId = decodedRefreshToken?._id
    ? String(decodedRefreshToken._id)
    : null;

  const credentialsMatch =
    !accessUserId || !refreshUserId || accessUserId === refreshUserId;
  const userId = credentialsMatch
    ? accessUserId || refreshUserId
    : null;
  if (userId) {
    const filter = { _id: userId };
    if (!accessUserId && incomingRefreshToken) {
      filter.refreshToken = incomingRefreshToken;
    }

    await User.findOneAndUpdate(filter, {
      $unset: {
        refreshToken: 1,
      },
    });
  }

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
      req.cookies?.refreshToken || req.body?.refreshToken;

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
  if (!filePath) throw new ApiError(400, "Avatar image is required");

  let uploadedAvatar;
  try {
    const bytes = await readFile(filePath);
    const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!isJpeg && !isPng && !isWebp) {
      throw new ApiError(415, "Avatar must contain a valid JPEG, PNG, or WebP image");
    }

    try {
      uploadedAvatar = await uploadOnCloudinary(filePath);
    } catch {
      throw new ApiError(502, "Avatar upload failed. Please try again.");
    }
    if (!uploadedAvatar?.secure_url || !uploadedAvatar?.public_id) {
      throw new ApiError(502, "Avatar upload failed. Please try again.");
    }

    let user;
    try {
      user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: uploadedAvatar.secure_url, avatarPublicId: uploadedAvatar.public_id },
        { new: true, runValidators: true },
      ).select("-password -refreshToken");
    } catch (error) {
      try {
        await deleteFromCloudinary(uploadedAvatar.public_id);
      } catch {
        // Keep the database error as the primary failure.
      }
      throw error;
    }

    if (!user) {
      await deleteFromCloudinary(uploadedAvatar.public_id).catch(() => {});
      throw new ApiError(404, "User not found");
    }

    const previousPublicId = req.user.avatarPublicId;
    if (previousPublicId && previousPublicId !== uploadedAvatar.public_id) {
      await deleteFromCloudinary(previousPublicId).catch((error) => {
        console.error("Previous avatar cleanup failed:", error.message);
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar updated successfully"));
  } finally {
    await removeTempFile(filePath);
  }
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
