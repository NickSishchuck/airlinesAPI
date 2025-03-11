const { pool } = require('../config/database');

/**
 * Get all aircraft with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated aircraft
 */
exports.getAllAircraft = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.query(`
    SELECT 
      a.aircraft_id,
      a.model,
      a.registration_number,
      a.capacity,
      a.manufacturing_year,
      a.captain_id,
      a.status,
      CONCAT(c.first_name, ' ', c.last_name) AS captain_name,
      c.license_number AS captain_license,
      a.created_at,
      a.updated_at
    FROM aircraft a
    JOIN captains c ON a.captain_id = c.captain_id
    ORDER BY a.registration_number
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  
  const [countRows] = await pool.query('SELECT COUNT(*) as count FROM aircraft');
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
 * Get aircraft by ID
 * @param {number} id - Aircraft ID
 * @returns {Promise<Object>} Aircraft details
 */
exports.getAircraftById = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      a.aircraft_id,
      a.model,
      a.registration_number,
      a.capacity,
      a.manufacturing_year,
      a.captain_id,
      a.status,
      CONCAT(c.first_name, ' ', c.last_name) AS captain_name,
      c.license_number AS captain_license,
      a.created_at,
      a.updated_at
    FROM aircraft a
    JOIN captains c ON a.captain_id = c.captain_id
    WHERE a.aircraft_id = ?
  `, [id]);
  
  return rows[0];
};

/**
 * Check if registration number already exists
 * @param {string} registrationNumber - Registration to check
 * @param {number} excludeId - Aircraft ID to exclude from check
 * @returns {Promise<boolean>} Whether registration exists
 */
exports.registrationExists = async (registrationNumber, excludeId = null) => {
  let query = 'SELECT COUNT(*) AS count FROM aircraft WHERE registration_number = ?';
  const params = [registrationNumber];
  
  if (excludeId) {
    query += ' AND aircraft_id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/**
 * Create a new aircraft
 * @param {Object} aircraftData - Aircraft data
 * @returns {Promise<number>} ID of the created aircraft
 */
exports.createAircraft = async (aircraftData) => {
  const {
    model,
    registration_number,
    capacity,
    manufacturing_year,
    captain_id,
    status = 'active'
  } = aircraftData;
  
  const [result] = await pool.query(`
    INSERT INTO aircraft (
      model, registration_number, capacity, 
      manufacturing_year, captain_id, status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [
    model,
    registration_number,
    capacity,
    manufacturing_year,
    captain_id,
    status
  ]);
  
  return result.insertId;
};

/**
 * Update an aircraft
 * @param {number} id - Aircraft ID
 * @param {Object} aircraftData - Aircraft data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updateAircraft = async (id, aircraftData) => {
  const {
    model,
    registration_number,
    capacity,
    manufacturing_year,
    captain_id,
    status
  } = aircraftData;
  
  const [result] = await pool.query(`
    UPDATE aircraft
    SET
      model = COALESCE(?, model),
      registration_number = COALESCE(?, registration_number),
      capacity = COALESCE(?, capacity),
      manufacturing_year = COALESCE(?, manufacturing_year),
      captain_id = COALESCE(?, captain_id),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE aircraft_id = ?
  `, [
    model,
    registration_number,
    capacity,
    manufacturing_year,
    captain_id,
    status,
    id
  ]);
  
  return result.affectedRows > 0;
};

/**
 * Delete an aircraft
 * @param {number} id - Aircraft ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deleteAircraft = async (id) => {
  const [result] = await pool.query('DELETE FROM aircraft WHERE aircraft_id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Get aircraft by captain ID
 * @param {number} captainId - Captain ID
 * @returns {Promise<Array>} Aircraft assigned to captain
 */
exports.getAircraftByCaptain = async (captainId) => {
  const [rows] = await pool.query(`
    SELECT 
      aircraft_id,
      model,
      registration_number,
      capacity,
      status
    FROM aircraft
    WHERE captain_id = ?
  `, [captainId]);
  
  return rows;
};

/**
 * Get flights for an aircraft
 * @param {number} aircraftId - Aircraft ID
 * @param {boolean} activeOnly - Only get active flights
 * @returns {Promise<Array>} Flights using this aircraft
 */
exports.getAircraftFlights = async (aircraftId, activeOnly = false) => {
  let query = `
    SELECT 
      f.flight_id,
      f.flight_number,
      r.origin,
      r.destination,
      f.departure_time,
      f.arrival_time,
      f.status,
      f.gate
    FROM flights f
    JOIN routes r ON f.route_id = r.route_id
    WHERE f.aircraft_id = ?
  `;
  
  if (activeOnly) {
    query += " AND f.status NOT IN ('canceled', 'arrived')";
  }
  
  query += " ORDER BY f.departure_time";
  
  const [rows] = await pool.query(query, [aircraftId]);
  
  return rows;
};
