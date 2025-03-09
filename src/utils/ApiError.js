class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.stack = stack; // Initialize stack here
    this.success = false;
    this.errors = errors; // Use the passed `errors` parameter

    // Remove the line `this.error = error;` (it's undefined)

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };