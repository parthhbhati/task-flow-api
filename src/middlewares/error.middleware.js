const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
    errors = [];
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((item) => item.message);
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : "Duplicate value";
    errors = [];
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON request body";
    errors = [];
  }

  if (statusCode >= 500) {
    statusCode = 500;
    errors = [];

    if (process.env.NODE_ENV === "production") {
      message = "Internal Server Error";
    }
  }

  return res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
};

export { errorHandler };
