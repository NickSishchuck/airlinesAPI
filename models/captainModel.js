// models/captainModel.js
const { pool } = require('../config/database');

/**
 * Get all captains with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated captains
 */
exports.getAllCaptains = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.query(`
    SELECT 
      c.captain_id,
      c.first_name,
      c.last_name,
      c.license_number,
      c.date_of_birth,
      c.experience_years,
      c.contact_number,
      c.email,
      (SELECT COUNT(*) FROM aircraft a WHERE a.captain_id = c.captain_id) AS aircraft_count,
      c.created_at,
      c.updated_at
    FROM captains c
    ORDER BY c.last_name, c.first_name
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  
  const [countRows] = await pool.query('SELECT COUNT(*) as count FROM captains');
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
 * Get captain by ID
 * @param {number} id - Captain ID
 * @returns {Promise<Object>} Captain details
 */
exports.getCaptainById = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      c.captain_id,
      c.first_name,
      c.last_name,
      c.license_number,
      c.date_of_birth,
      c.experience_years,
      c.contact_number,
      c.email,
      (SELECT COUNT(*) FROM aircraft a WHERE a.captain_id = c.captain_id) AS aircraft_count,
      c.created_at,
      c.updated_at
    FROM captains c
    WHERE c.captain_id = ?
  `, [id]);
  
  return rows[0];
};

/**
 * Check if license number already exists
 * @param {string} licenseNumber - License to check
 * @param {number} excludeId - Captain ID to exclude from check
 * @returns {Promise<boolean>} Whether license exists
 */
exports.licenseExists = async (licenseNumber, excludeId = null) => {
  let query = 'SELECT COUNT(*) AS count FROM captains WHERE license_number = ?';
  const params = [licenseNumber];
  
  if (excludeId) {
    query += ' AND captain_id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/**
 * Create a new captain
 * @param {Object} captainData - Captain data
 * @returns {Promise<number>} ID of the created captain
 */
exports.createCaptain = async (captainData) => {
  const {
    first_name,
    last_name,
    license_number,
    date_of_birth,
    experience_years,
    contact_number,
    email
  } = captainData;
  
  const [result] = await pool.query(`
    INSERT INTO captains (
      first_name, last_name, license_number, 
      date_of_birth, experience_years, contact_number, email
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    first_name,
    last_name,
    license_number,
    date_of_birth,
    experience_years,
    contact_number,
    email
  ]);
  
  return result.insertId;
};

/**
 * Update a captain
 * @param {number} id - Captain ID
 * @param {Object} captainData - Captain data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updateCaptain = async (id, captainData) => {
  const {
    first_name,
    last_name,
    license_number,
    date_of_birth,
    experience_years,
    contact_number,
    email
  } = captainData;
  
  const [result] = await pool.query(`
    UPDATE captains
    SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      license_number = COALESCE(?, license_number),
      date_of_birth = COALESCE(?, date_of_birth),
      experience_years = COALESCE(?, experience_years),
      contact_number = COALESCE(?, contact_number),
      email = COALESCE(?, email),
      updated_at = CURRENT_TIMESTAMP
    WHERE captain_id = ?
  `, [
    first_name,
    last_name,
    license_number,
    date_of_birth,
    experience_years,
    contact_number,
    email,
    id
  ]);
  
  return result.affectedRows > 0;
};

/**
 * Delete a captain
 * @param {number} id - Captain ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deleteCaptain = async (id) => {
  const [result] = await pool.query('DELETE FROM captains WHERE captain_id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Get flights for a captain
 * @param {number} captainId - Captain ID
 * @returns {Promise<Array>} Flights managed by this captain
 */
exports.getCaptainFlights = async (captainId) => {
  const [rows] = await pool.query(`
    SELECT 
      f.flight_id,
      f.flight_number,
      r.origin,
      r.destination,
      f.departure_time,
      f.arrival_time,
      f.status,
      a.model AS aircraft_model,
      a.registration_number
    FROM flights f
    JOIN routes r ON f.route_id = r.route_id
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    WHERE a.captain_id = ?
    ORDER BY f.departure_time
  `, [captainId]);
  
  return rows;
};