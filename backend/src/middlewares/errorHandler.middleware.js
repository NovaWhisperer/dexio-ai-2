import { NODE_ENV } from "../../config/index.js";

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode;
  let errMessage = err.message;
  let stack = err.stack;

  statusCode = statusCode || 500;
  errMessage = errMessage || "Internal Server Error";

  if (NODE_ENV === "development") {
    res.status(statusCode).json({
      success: false,
      data: null,
      error: errMessage,
      stack: stack,
    });
  } else {
    res.status(statusCode).json({
      success: false,
      data: null,
      error: errMessage,
    });
  }
};

export { errorHandler };
