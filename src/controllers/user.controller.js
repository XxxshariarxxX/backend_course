import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { apiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
};

const generateAccessTokenAndRefreshTokens = async (userId) => {
  try {
    // Fetch user from the database
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token in the user document
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };

  } catch (error) {
    console.error("Token Generation Error:", error);
    throw new ApiError(500, "Failed to generate access and refresh tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;

  if ([fullName, email, userName, password].some(field => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields (fullName, email, userName, password) are required and cannot be empty");
  }

  const existedUser = await User.findOne({ $or: [{ email }, { userName }] });
  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const avatarUrl = avatar?.url || avatar?.secure_url || (typeof avatar === 'string' ? avatar : null);
  if (!avatarUrl) {
    throw new ApiError(500, "Failed to upload avatar to Cloudinary - No valid URL returned");
  }

  let coverImageUrl = "";
  if (req.files?.coverImage?.[0]?.path) {
    const coverImage = await uploadOnCloudinary(req.files.coverImage[0].path);
    coverImageUrl = coverImage?.url || coverImage?.secure_url || (typeof coverImage === 'string' ? coverImage : null);
    if (!coverImageUrl) {
      throw new ApiError(500, "Failed to upload cover image to Cloudinary - No valid URL returned");
    }
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: email.trim(),
    userName: userName.trim(),
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Failed to retrieve created user");
  }

  res.status(201).json({
    status: 201,
    message: "User registered successfully",
    data: createdUser
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  if (!email && !userName) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({ $or: [{ email }, { userName }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken
      }, "User logged in successfully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined
    },
  }, {
    new: true
  });

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new apiResponse(200, {}, "User logged out successfully")
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "invalid refresh token");
  }
  try {
    const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }
  
    const options = {
      httpOnly: true,
      secure: true
    };
    await generateAccessTokenAndRefreshTokens(user._id);
    
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(200, {}, "Access token refreshed successfully")
      );
  } catch (error) {
    throw new ApiError(401, "invalid refresh token");
  }
});

  const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldpassword, newPassword } = req.body;
  
  
    const user = await User.findById(req.user?._id);
  
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid old password");
    }

  
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
  
    return res
    .status(200)
    .json({
      status: 200,
      message: "Password changed successfully"
    });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new apiResponse(200, req.user, "User retrieved successfully")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname , email } = req.body;

  if(!fullname || !email){
    throw new ApiError(400, "fullname or email is required");
  }
  const user = await User.findByIdAndUpdate(req.user?._id,{
    fullname,
    email:email
  }, {
    new: true 
  }).select("-password");

  return res
    .status(200)
    .json(
      new apiResponse(200, user, "User details updated successfully")
    );

});

const updateUserAatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  
  if(!avatar.url){
    throw new ApiError(400, "error while uploading avatar");
  }
  await User.findByIdAndUpdate(req.user?._id,
    {
      $set: { avatar: avatar.url }
    },{new:true}).select("-password");

    return res
    .status(200)
    .json({
      status: 200,
      message: "Avatar updated successfully"
    });
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  
  if(!coverImage.url){
    throw new ApiError(400, "error while uploading cover image");
  }
  await User.findByIdAndUpdate(req.user?._id,
    {
      $set: { coverImage: coverImage.url }
    },{new:true}).select("-password");

    return res
    .status(200)
    .json({
      status: 200,
      message: "Cover image updated successfully"
    });
});
  

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAatar, updateUserCoverImage };
