const { pool } = require('../config/database');

/**
 * Get all routes
 * @returns {Promise<Array>} Array of routes
 */
exports.getAllRoutes = async () => {
  const [rows] = await pool.query(`
    SELECT 
      r.route_id,
      r.origin,
      r.destination,
      r.distance,
      r.estimated_duration,
      (SELECT COUNT(*) FROM flights f WHERE f.route_id = r.route_id) AS flight_count
    FROM routes r
    ORDER BY r.origin, r.destination
  `);
  
  return rows;
};

/**
 * Get route by ID
 * @param {number} id - Route ID
 * @returns {Promise<Object>} Route details
 */
exports.getRouteById = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      r.route_id,
      r.origin,
      r.destination,
      r.distance,
      r.estimated_duration,
      (SELECT COUNT(*) FROM flights f WHERE f.route_id = r.route_id) AS flight_count
    FROM routes r
    WHERE r.route_id = ?
  `, [id]);
  
  return rows[0];
};

/**
 * Create a new route
 * @param {Object} routeData - Route data
 * @returns {Promise<number>} ID of the created route
 */
exports.createRoute = async (routeData) => {
  const {
    origin,
    destination,
    distance,
    estimated_duration
  } = routeData;
  
  const [result] = await pool.query(`
    INSERT INTO routes (
      origin, destination, distance, estimated_duration
    ) VALUES (?, ?, ?, ?)
  `, [
    origin,
    destination,
    distance,
    estimated_duration
  ]);
  
  return result.insertId;
};

/**
 * Update a route
 * @param {number} id - Route ID
 * @param {Object} routeData - Route data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updateRoute = async (id, routeData) => {
  const {
    origin,
    destination,
    distance,
    estimated_duration
  } = routeData;
  
  const [result] = await pool.query(`
    UPDATE routes
    SET
      origin = COALESCE(?, origin),
      destination = COALESCE(?, destination),
      distance = COALESCE(?, distance),
      estimated_duration = COALESCE(?, estimated_duration)
    WHERE route_id = ?
  `, [
    origin,
    destination,
    distance,
    estimated_duration,
    id
  ]);
  
  return result.affectedRows > 0;
};

/**
 * Delete a route
 * @param {number} id - Route ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deleteRoute = async (id) => {
  const [result] = await pool.query('DELETE FROM routes WHERE route_id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Check if route exists
 * @param {string} origin - Origin city/airport
 * @param {string} destination - Destination city/airport
 * @param {number} excludeRouteId - Route ID to exclude from check
 * @returns {Promise<boolean>} Whether route exists
 */
exports.routeExists = async (origin, destination, excludeRouteId = null) => {
  let query = 'SELECT COUNT(*) AS count FROM routes WHERE origin = ? AND destination = ?';
  const params = [origin, destination];
  
  if (excludeRouteId) {
    query += ' AND route_id != ?';
    params.push(excludeRouteId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/**
 * Get flights for a route
 * @param {number} routeId - Route ID
 * @returns {Promise<Array>} Flights on this route
 */
exports.getRouteFlights = async (routeId) => {
  const [rows] = await pool.query(`
    SELECT 
      f.flight_id,
      f.flight_number,
      f.departure_time,
      f.arrival_time,
      f.status,
      a.model AS aircraft_model
    FROM flights f
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    WHERE f.route_id = ?
    ORDER BY f.departure_time
  `, [routeId]);
  
  return rows;
};
