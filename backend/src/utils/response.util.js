/**
 * Format a successful API response
 * @param {object} res Express response object
 * @param {number} statusCode HTTP status code
 * @param {string} message Success message
 * @param {any} data Response data (optional)
 */
export const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format an error API response (Used mostly for soft errors inside controllers, 
 * fatal errors should be thrown to the global error handler)
 * @param {object} res Express response object
 * @param {number} statusCode HTTP status code
 * @param {string} message Error message
 * @param {any} errors Detailed errors (e.g. validation errors array) (optional)
 */
export const errorResponse = (res, statusCode = 400, message = 'Error', errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
