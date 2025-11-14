import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Retrieve token from cookies or Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        // Verify the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Find the user in the database
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch {
        throw new ApiError(401, "Invalid Access Token");
    }
});

export const verifyDevice = asyncHandler(async (req, res, next) => {
    const apiKey = req.header('x-api-key');
    const deviceId = req.header('x-device-id');

    if (!apiKey || !deviceId) {
        throw new ApiError(401, 'Device ID and API Key are required');
    }

    // --- Corrected Logic ---

    // 1. Check for a shared API key, converting the env var to a String.
    const sharedKey = String(process.env.DEVICE_API_KEY);
    if (apiKey === sharedKey) {
        req.device = { id: deviceId, type: 'shared' };
        return next();
    }

    // 2. Check for a per-device API key, converting the env var to a String.
    const perDeviceKey = process.env[`DEVICE_${deviceId}_KEY`];
    if (perDeviceKey && apiKey === String(perDeviceKey)) {
        req.device = { id: deviceId, type: 'specific' };
        return next();
    }

    // --- End Correction ---

    // If neither key matches, deny access.
    throw new ApiError(401, 'Invalid API Key');
});