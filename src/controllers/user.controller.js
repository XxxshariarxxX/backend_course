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

  const { fullName, email, userName, password } = req.body;

  if(
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ){
    throw new ApiError(400, "Please fill in all fields");
  }
  const existedUser = User.findOne({
    $or: [{ email }, { userName }],
  })

  if(existedUser){
    throw new ApiError(400, "User with this email or username already exists");
  }
  
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath){
    throw new ApiError(400, "Please upload an avatar");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if(!avatar){
    throw new ApiError(400, "Failed to upload avatar");
  }
  const user = await User.create({
    fullName,
    avatar: avatar?.url,
    coverImage: coverImage?.url,
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if(!createdUser){
    throw new ApiError(500, "something went wrong when registering user");
  }
  return res.status(201).json(
    new ApiError(200, "User registered successfully", createdUser)
  );

 });

export {registerUser};