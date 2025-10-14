// error-handler.js

const errorHandler = (err, req, res, next) => {
    // Set default values for status and message
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';
    const message = err.message || 'Something went wrong';
    const isOperational = err.isOperational || true

    // Build the error response object
    const errorResponse = {
        status,
        message,
        statusCode,
        isOperational
    };

    // Add validation errors if they exist
    if (err.validation) {
        errorResponse.validation = err.validation;
    }

    // Include the stack trace only in development mode
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    // Send the JSON response
    res.status(statusCode).json(errorResponse);
};

export default errorHandler;