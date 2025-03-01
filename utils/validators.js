// utils/validators.js
/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
exports.isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validate passport number format
   * @param {string} passport - Passport number
   * @returns {boolean} Whether passport number is valid
   */
  exports.isValidPassport = (passport) => {
    // Most passport numbers are 8-9 characters, alphanumeric
    return /^[A-Z0-9]{6,12}$/i.test(passport);
  };
  
  /**
   * Validate flight number format
   * @param {string} flightNumber - Flight number to validate
   * @returns {boolean} Whether flight number is valid
   */
  exports.isValidFlightNumber = (flightNumber) => {
    // Common format is 2 letters followed by 1-4 digits
    return /^[A-Z]{2}\d{1,4}$/i.test(flightNumber);
  };
  
  /**
   * Validate seat number format
   * @param {string} seatNumber - Seat number to validate
   * @returns {boolean} Whether seat number is valid
   */
  exports.isValidSeatNumber = (seatNumber) => {
    // Format is usually like 1A, 24C, etc.
    return /^\d{1,2}[A-Z]$/i.test(seatNumber);
  };
  
 