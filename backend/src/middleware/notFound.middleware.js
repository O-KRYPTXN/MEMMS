/**
 * Middleware to catch 404 Not Found errors and pass them to the global error handler
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
