/**
 * Parses query parameters and returns Prisma-compatible pagination options
 * @param {object} query The req.query object
 * @param {number} defaultLimit Default number of items per page
 * @returns {object} { skip, take, page, limit, orderBy }
 */
export const getPaginationParams = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, parseInt(query.limit) || defaultLimit);
  
  const skip = (page - 1) * limit;
  const take = limit;
  
  let orderBy = { createdAt: 'desc' }; // default sort
  
  if (query.sortBy) {
    const sortField = query.sortBy;
    const sortOrder = query.sortOrder && query.sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
    orderBy = { [sortField]: sortOrder };
  }

  return { skip, take, page, limit, orderBy };
};

/**
 * Formats a paginated response
 * @param {Array} data The items for the current page
 * @param {number} totalItems The total number of items in the database
 * @param {number} page The current page number
 * @param {number} limit The number of items per page
 * @returns {object} Standardized paginated structure
 */
export const formatPaginatedResponse = (data, totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    items: data,
    meta: {
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  };
};
