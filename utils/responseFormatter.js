 // utils/responseFormatter.js
  /**
   * Format a successful response
   * @param {object} data - Response data
   * @param {number} statusCode - HTTP status code (default: 200)
   * @returns {object} Formatted response object
   */
  exports.successResponse = (data, statusCode = 200) => {
    return {
      statusCode,
      success: true,
      data
    };
  };
  
  /**
   * Format a list response with pagination
   * @param {Array} items - List of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items count
   * @returns {object} Formatted response with pagination
   */
  exports.paginatedResponse = (items, page, limit, total) => {
    return {
      statusCode: 200,
      success: true,
      count: items.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      },
      data: items
    };
  };
  
  /**
   * Format an error response
   * @param {Error} error - Error object
   * @param {number} statusCode - HTTP status code (default: 500)
   * @returns {object} Formatted error response
   */
  exports.errorResponse = (error, statusCode = 500) => {
    return {
      statusCode,
      success: false,
      error: error.message || 'Server Error'
    };
  };