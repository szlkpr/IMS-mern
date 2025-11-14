import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        
        return { accessToken, refreshToken }

    }catch {
        throw new ApiError(500, "Token generation failed")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend or postman
    const {name, email, password, role, phone} = req.body 

    // validation - not empty
    if (!name || !email || !password) {
        throw new ApiError(400, "Please provide all the required fields")
    }

    // check if user already exists: email or phone number
    const existedUser = await User.findOne({ 
        $or: [{ email: email }, { phone: phone }]
    })

    if (existedUser) {
        throw new ApiError(400, "User already exists")
    }

    let avatarUrl = "https://www.gravatar.com/avatar/?d=mp"; // Default avatar from schema

    const avatarLocalPath = req.file?.path;

    if (avatarLocalPath) { // Only upload if an avatar is provided
        const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);

        if (!uploadedAvatar) {
            throw new ApiError(500, "Avatar upload failed");
        }
        avatarUrl = uploadedAvatar.url;
    }

    // create user object - create entry in db
    const user = await User.create({ 
        name,
        email,
        phone: phone || undefined,
        password,
        role: role || "sub-admin",
        avatar: avatarUrl, // Use the uploaded URL or default
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "User creation failed")
    }

    // return response
    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User created successfully"
        )
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // Log the incoming request body for debugging
    console.log("Request Body:", req.body);

    // Get user details from frontend or Postman
    const { email, phone, password } = req.body;

    // Log extracted fields
    console.log("Email:", email, "Phone:", phone, "Password:", password ? "Provided" : "Not Provided");

    // Validation - at least one of email or phone must be provided
    if (!email && !phone) {
        console.error("Validation Error: Missing email or phone");
        throw new ApiError(400, "Please provide email or phone number");
    }

    if (!password) {
        console.error("Validation Error: Missing password");
        throw new ApiError(400, "Please provide a password");
    }

    // Check if user exists: email or phone number
    const query = { $or: [] };
    if (email) {
        query.$or.push({ email });
    }
    if (phone) {
        query.$or.push({ phone });
    }
    const user = await User.findOne(query);

    if (!user) {
        console.error("User not found");
        throw new ApiError(404, "User not found");
    }

    // Verify password
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
        console.error("Incorrect password");
        throw new ApiError(401, "Incorrect password");
    }

    // Access token and refresh token generation
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Send cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    console.log("Login successful for user:", loggedInUser);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

const options = {
    httpOnly: true,
    secure: true
}

return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(new ApiResponse(200, {}, "User logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    // Log the token for debugging
    console.log("Incoming Refresh Token:", incomingRefreshToken);

    // Validate the token
    if (!incomingRefreshToken) {
        console.error("Refresh token not provided");
        throw new ApiError(401, "Refresh token not provided");
    }

    if (typeof incomingRefreshToken !== "string" || incomingRefreshToken.split(".").length !== 3) {
        console.error("Invalid or malformed refresh token");
        throw new ApiError(401, "Refresh token is invalid or malformed");
    }

    try {
        // Verify the token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            console.error("User not found for decoded token");
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            console.error("Refresh token mismatch");
            throw new ApiError(401, "Expired refresh token");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken,
                    },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword, confPassword} = req.body

    if(!(newPassword === confPassword)) {
        throw new ApiError(400, "Passwords do not match")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.matchPassword(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    )
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {name, email, phone} = req.body

    if (!name || !email) {
        throw new ApiError(400, "Please provide all the required fields")
    }

   const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                name,
                email,
                phone: phone || undefined
            }
        },
        {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
        new ApiResponse(
            200,
            user,
            "User details updated successfully"
        )
   )
})

const updateUserAvatar = asyncHandler(async (req, res) => {

        const avatarLocalPath = req.file?.path
        
        if (!avatarLocalPath) {
            throw new ApiError(400, "Please provide an avatar")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if(!avatar.url) {
            throw new ApiError(500, "Avatar upload failed")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            {new: true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar updated successfully"
            )
        )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar
 };