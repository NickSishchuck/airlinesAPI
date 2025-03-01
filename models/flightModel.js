// models/flightModel.js
const { pool } = require('../config/database');
const dateFormat = require('../utils/dateFormat');

/**
 * Get all flights
 * @returns {Promise<Array>} Array of flights
 */
exports.getAllFlights = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.query(`
    SELECT 
      f.flight_id,
      f.flight_number,
      r.origin,
      r.destination,
      f.departure_time,
      f.arrival_time,
      f.status,
      f.gate,
      a.model AS aircraft_model,
      a.registration_number
    FROM flights f
    JOIN routes r ON f.route_id = r.route_id
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    ORDER BY f.departure_time
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  
  const [countRows] = await pool.query('SELECT COUNT(*) as count FROM flights');
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
 * Get flight by ID
 * @param {number} id - Flight ID
 * @returns {Promise<Object>} Flight details
 */
exports.getFlightById = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      f.flight_id,
      f.flight_number,
      r.route_id,
      r.origin,
      r.destination,
      f.aircraft_id,
      a.model AS aircraft_model,
      a.registration_number,
      f.departure_time,
      f.arrival_time,
      f.status,
      f.gate,
      CONCAT(c.first_name, ' ', c.last_name) AS captain_name,
      c.captain_id,
      (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id) AS booked_seats,
      a.capacity AS total_capacity
    FROM flights f
    JOIN routes r ON f.route_id = r.route_id
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    JOIN captains c ON a.captain_id = c.captain_id
    WHERE f.flight_id = ?
  `, [id]);
  
  return rows[0];
};

/**
 * Create a new flight
 * @param {Object} flightData - Flight data
 * @returns {Promise<number>} ID of the created flight
 */
exports.createFlight = async (flightData) => {
  const {
    flight_number,
    route_id,
    aircraft_id,
    departure_time,
    arrival_time,
    status = 'scheduled',
    gate
  } = flightData;
  
  const [result] = await pool.query(`
    INSERT INTO flights (
      flight_number, route_id, aircraft_id, 
      departure_time, arrival_time, status, gate
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    flight_number,
    route_id,
    aircraft_id,
    departure_time,
    arrival_time,
    status,
    gate
  ]);
  
  return result.insertId;
};

/**
 * Update a flight
 * @param {number} id - Flight ID
 * @param {Object} flightData - Flight data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updateFlight = async (id, flightData) => {
  const {
    flight_number,
    route_id,
    aircraft_id,
    departure_time,
    arrival_time,
    status,
    gate
  } = flightData;
  
  const [result] = await pool.query(`
    UPDATE flights
    SET
      flight_number = COALESCE(?, flight_number),
      route_id = COALESCE(?, route_id),
      aircraft_id = COALESCE(?, aircraft_id),
      departure_time = COALESCE(?, departure_time),
      arrival_time = COALESCE(?, arrival_time),
      status = COALESCE(?, status),
      gate = COALESCE(?, gate),
      updated_at = CURRENT_TIMESTAMP
    WHERE flight_id = ?
  `, [
    flight_number,
    route_id,
    aircraft_id,
    departure_time,
    arrival_time,
    status,
    gate,
    id
  ]);
  
  return result.affectedRows > 0;
};

/**
 * Delete a flight
 * @param {number} id - Flight ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deleteFlight = async (id) => {
  const [result] = await pool.query('DELETE FROM flights WHERE flight_id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Search flights by route and date
 * @param {string} origin - Origin city/airport
 * @param {string} destination - Destination city/airport
 * @param {string} date - Flight date (YYYY-MM-DD)
 * @returns {Promise<Array>} Matching flights
 */
exports.searchFlightsByRouteAndDate = async (origin, destination, date) => {
  const [rows] = await pool.query(`CALL search_flights_by_route_and_date(?, ?, ?)`, 
    [origin, destination, date]);
  
  return rows[0];
};

/**
 * Generate flight schedule
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Flight schedule
 */
exports.generateFlightSchedule = async (startDate, endDate) => {
  const [rows] = await pool.query(`CALL generate_flight_schedule(?, ?)`, 
    [startDate, endDate]);
  
  return rows[0];
};

/**
 * Check if aircraft is available for time period
 * @param {number} aircraftId - Aircraft ID
 * @param {string} departure - Departure time
 * @param {string} arrival - Arrival time
 * @param {number} excludeFlightId - Flight ID to exclude from check
 * @returns {Promise<boolean>} Whether aircraft is available
 */
exports.isAircraftAvailable = async (aircraftId, departure, arrival, excludeFlightId = null) => {
  let query = `
    SELECT COUNT(*) AS count FROM flights 
    WHERE aircraft_id = ? 
    AND ((departure_time <= ? AND arrival_time >= ?) 
         OR (departure_time <= ? AND arrival_time >= ?) 
         OR (departure_time >= ? AND arrival_time <= ?))
    AND status NOT IN ('canceled', 'arrived')
  `;
  
  const params = [
    aircraftId, 
    departure, departure, 
    arrival, arrival, 
    departure, arrival
  ];
  
  if (excludeFlightId) {
    query += ' AND flight_id != ?';
    params.push(excludeFlightId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count === 0;
};

/**
 * Update flight status
 * @param {number} id - Flight ID
 * @param {string} status - New status
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updateFlightStatus = async (id, status) => {
  const [result] = await pool.query(
    'UPDATE flights SET status = ? WHERE flight_id = ?', 
    [status, id]
  );
  
  return result.affectedRows > 0;
};