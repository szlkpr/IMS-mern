import { ApiError } from "../utils/apiError.js";

const errorHandler = (err, req, res, _next) => { // eslint-disable-line no-unused-vars
    let error = err;

    // If it's not an instance of ApiError, convert it
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        success: false,
        statusCode: error.statusCode,
        message: error.message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
        ...(error.errors.length > 0 && { errors: error.errors })
    };

    return res.status(error.statusCode).json(response);
};

export { errorHandler };