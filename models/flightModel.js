const { pool } = require('../config/database');
const dateFormat = require('../utils/dateFormat');

/**
 * Get all flights with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated flights
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
      f.base_price,
      a.model AS aircraft_model,
      a.registration_number,
      c.name AS crew_name
    FROM flights f
    JOIN routes r ON f.route_id = r.route_id
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    LEFT JOIN crews c ON a.crew_id = c.crew_id
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
      f.base_price,
      c.crew_id,
      c.name AS crew_name,
      (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id) AS booked_seats,
      a.capacity AS total_capacity
    FROM flights f
    JOIN routes r ON f.route_id = r.route_id
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    LEFT JOIN crews c ON a.crew_id = c.crew_id
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
    gate,
    base_price
  } = flightData;
  
  const [result] = await pool.query(`
    INSERT INTO flights (
      flight_number, route_id, aircraft_id, 
      departure_time, arrival_time, status, gate, base_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    flight_number,
    route_id,
    aircraft_id,
    departure_time,
    arrival_time,
    status,
    gate,
    base_price
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
    gate,
    base_price
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
      base_price = COALESCE(?, base_price)
    WHERE flight_id = ?
  `, [
    flight_number,
    route_id,
    aircraft_id,
    departure_time,
    arrival_time,
    status,
    gate,
    base_price,
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
  const [rows] = await pool.query(`
    SELECT 
      f.flight_id,
      f.flight_number,
      r.origin,
      r.destination,
      f.departure_time,
      f.arrival_time,
      f.status,
      f.base_price,
      a.model AS aircraft_model,
      (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id) AS booked_seats,
      a.capacity AS total_seats
    FROM 
      flights f
    JOIN 
      routes r ON f.route_id = r.route_id
    JOIN 
      aircraft a ON f.aircraft_id = a.aircraft_id
    WHERE 
      r.origin = ? AND 
      r.destination = ? AND 
      DATE(f.departure_time) = ? AND
      f.status != 'canceled'
    ORDER BY 
      f.departure_time
  `, [origin, destination, date]);
  
  return rows;
};

/**
 * Generate flight schedule
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Flight schedule
 */
exports.generateFlightSchedule = async (startDate, endDate) => {
  const [rows] = await pool.query(`
    SELECT 
      f.flight_id,
      f.flight_number,
      r.origin,
      r.destination,
      f.departure_time,
      f.arrival_time,
      f.status,
      f.base_price,
      a.registration_number AS aircraft,
      c.name AS crew_name,
      (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id) AS passengers_count,
      a.capacity AS total_capacity
    FROM 
      flights f
    JOIN 
      routes r ON f.route_id = r.route_id
    JOIN 
      aircraft a ON f.aircraft_id = a.aircraft_id
    LEFT JOIN 
      crews c ON a.crew_id = c.crew_id
    WHERE 
      DATE(f.departure_time) BETWEEN ? AND ?
    ORDER BY 
      f.departure_time
  `, [startDate, endDate]);
  
  return rows;
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

/**
 * Calculate ticket price based on flight base price and class
 * @param {number} flightId - Flight ID
 * @param {string} ticketClass - Ticket class (economy, business, first)
 * @returns {Promise<number>} Calculated ticket price
 */
exports.calculateTicketPrice = async (flightId, ticketClass) => {
  // Get the flight base price
  const [flightRows] = await pool.query(
    'SELECT base_price FROM flights WHERE flight_id = ?',
    [flightId]
  );
  
  if (flightRows.length === 0) {
    throw new Error('Flight not found');
  }
  
  const basePrice = flightRows[0].base_price;
  
  // Apply multiplier based on class
  const classMultipliers = {
    economy: 1.0,
    business: 2.5,
    first: 4.0
  };
  
  const multiplier = classMultipliers[ticketClass] || 1.0;
  
  return basePrice * multiplier;
};