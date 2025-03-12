/**
 * Error response class for API errors
 * @extends Error
 */
class ErrorResponse extends Error {
    /**
     * Create an ErrorResponse
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     */
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  
  module.exports = ErrorResponse;