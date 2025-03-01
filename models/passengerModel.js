// models/passengerModel.js
const { pool } = require('../config/database');

/**
 * Get all passengers with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated passengers
 */
exports.getAllPassengers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.query(`
    SELECT 
      passenger_id,
      first_name,
      last_name,
      passport_number,
      nationality,
      date_of_birth,
      contact_number,
      email,
      created_at,
      updated_at
    FROM passengers
    ORDER BY last_name, first_name
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  
  const [countRows] = await pool.query('SELECT COUNT(*) as count FROM passengers');
  const count = countRows[0].count;
  
  return {
    data: rows,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalItems: count
  };
};

/**
 * Get passenger by ID
 * @param {number} id - Passenger ID
 * @returns {Promise<Object>} Passenger details
 */
exports.getPassengerById = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      p.passenger_id,
      p.first_name,
      p.last_name,
      p.passport_number,
      p.nationality,
      p.date_of_birth,
      p.contact_number,
      p.email,
      p.created_at,
      p.updated_at,
      (SELECT COUNT(*) FROM tickets t WHERE t.passenger_id = p.passenger_id) AS ticket_count
    FROM passengers p
    WHERE p.passenger_id = ?
  `, [id]);
  
  return rows[0];
};

/**
 * Check if passport number already exists
 * @param {string} passportNumber - Passport number to check
 * @param {number} excludeId - Passenger ID to exclude from check
 * @returns {Promise<boolean>} Whether passport exists
 */
exports.passportExists = async (passportNumber, excludeId = null) => {
  let query = 'SELECT COUNT(*) AS count FROM passengers WHERE passport_number = ?';
  const params = [passportNumber];
  
  if (excludeId) {
    query += ' AND passenger_id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/**
 * Create a new passenger
 * @param {Object} passengerData - Passenger data
 * @returns {Promise<number>} ID of the created passenger
 */
exports.createPassenger = async (passengerData) => {
  const {
    first_name,
    last_name,
    passport_number,
    nationality,
    date_of_birth,
    contact_number,
    email
  } = passengerData;
  
  const [result] = await pool.query(`
    INSERT INTO passengers (
      first_name, last_name, passport_number, 
      nationality, date_of_birth, contact_number, email
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    first_name,
    last_name,
    passport_number,
    nationality,
    date_of_birth,
    contact_number,
    email
  ]);
  
  return result.insertId;
};

/**
 * Update a passenger
 * @param {number} id - Passenger ID
 * @param {Object} passengerData - Passenger data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updatePassenger = async (id, passengerData) => {
  const {
    first_name,
    last_name,
    passport_number,
    nationality,
    date_of_birth,
    contact_number,
    email
  } = passengerData;
  
  const [result] = await pool.query(`
    UPDATE passengers
    SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      passport_number = COALESCE(?, passport_number),
      nationality = COALESCE(?, nationality),
      date_of_birth = COALESCE(?, date_of_birth),
      contact_number = COALESCE(?, contact_number),
      email = COALESCE(?, email),
      updated_at = CURRENT_TIMESTAMP
    WHERE passenger_id = ?
  `, [
    first_name,
    last_name,
    passport_number,
    nationality,
    date_of_birth,
    contact_number,
    email,
    id
  ]);
  
  return result.affectedRows > 0;
};

/**
 * Delete a passenger
 * @param {number} id - Passenger ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deletePassenger = async (id) => {
  const [result] = await pool.query('DELETE FROM passengers WHERE passenger_id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Search passengers by name or passport
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching passengers
 */
exports.searchPassengers = async (searchTerm) => {
  const [rows] = await pool.query(`
    SELECT 
      passenger_id,
      first_name,
      last_name,
      passport_number,
      nationality,
      email
    FROM passengers
    WHERE 
      CONCAT(first_name, ' ', last_name) LIKE ? OR
      passport_number LIKE ?
    ORDER BY last_name, first_name
    LIMIT 20
  `, [`%${searchTerm}%`, `%${searchTerm}%`]);
  
  return rows;
};