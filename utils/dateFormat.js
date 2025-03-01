// utils/dateFormat.js
/**
 * Format a date object to YYYY-MM-DD format
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
exports.formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  /**
   * Format a date object to HH:MM format
   * @param {Date} date - The date to format
   * @returns {string} Formatted time string
   */
  exports.formatTime = (date) => {
    const d = new Date(date);
    return d.toTimeString().split(' ')[0].substring(0, 5);
  };
  
  /**
   * Format a datetime to MySQL datetime format
   * @param {Date} date - The date to format
   * @returns {string} MySQL formatted datetime
   */
  exports.formatMySQLDateTime = (date) => {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
  };
  
  /**
   * Calculate duration between two dates in hours and minutes
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @returns {string} Duration in HH:MM format
   */
  exports.calculateDuration = (start, end) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  