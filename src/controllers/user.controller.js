
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const registerUser = asyncHandler(async (req, res) => {
    // get user data from frontend
  //validation - not empty, email, password, etc
  //check if user exists: email, username
  // check for image, check for avatar
  //upload them to cloudinary
  //create user object - create entry in db
  //remove password and refresh token from response
  // check for user creation
  //return response


  // console.log("Request Body:", req.body);
  // console.log("Request Files:", req.files);

  const { fullName, email, userName, password } = req.body;

  // Validate required fields
  if ([fullName, email, userName, password].some(field => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields (fullName, email, userName, password) are required and cannot be empty");
  }

  // Check if user exists
  const existedUser = await User.findOne({ $or: [{ email }, { userName }] });
  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // Handle avatar upload
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // console.log("Avatar upload result:", avatar); // Critical debug log
  const avatarUrl = avatar?.url || avatar?.secure_url || (typeof avatar === 'string' ? avatar : null);
  if (!avatarUrl) {
    throw new ApiError(500, "Failed to upload avatar to Cloudinary - No valid URL returned");
  }

  // Handle cover image (optional)
  let coverImageUrl = "";
  if (req.files?.coverImage?.[0]?.path) {
    const coverImageLocalPath = req.files.coverImage[0].path;
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // console.log("Cover image upload result:", coverImage); // Critical debug log
    coverImageUrl = coverImage?.url || coverImage?.secure_url || (typeof coverImage === 'string' ? coverImage : null);
    if (!coverImageUrl) {
      throw new ApiError(500, "Failed to upload cover image to Cloudinary - No valid URL returned");
    }
  }

  // Create user
  const user = await User.create({
    fullName: fullName.trim(),
    email: email.trim(),
    userName: userName.trim(),
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl
  });

  // Fetch created user
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

export { registerUser };