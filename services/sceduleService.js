const { pool } = require('../config/database');
const { formatMySQLDateTime } = require('../utils/dateFormat');
const logger = require('../utils/logger');

/**
 * Create recurring flights based on a template
 * @param {Object} flightTemplate - Base flight details
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Array} daysOfWeek - Days to schedule (0=Sunday, 6=Saturday)
 * @returns {Promise<Array>} Created flight IDs
 */
exports.createRecurringFlights = async (flightTemplate, startDate, endDate, daysOfWeek) => {
  const createdFlightIds = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  try {
    if (!flightTemplate.flight_number || !flightTemplate.route_id || 
        !flightTemplate.aircraft_id || !flightTemplate.departure_time) {
      throw new Error('Missing required flight template fields');
    }
    const baseTime = new Date(flightTemplate.departure_time);
    const hours = baseTime.getHours();
    const minutes = baseTime.getMinutes();

    let durationMs;
    if (flightTemplate.arrival_time) {
      durationMs = new Date(flightTemplate.arrival_time) - baseTime;
    } else {
      // Get duration from route
      const [routeRows] = await pool.query(
        'SELECT estimated_duration FROM routes WHERE route_id = ?',
        [flightTemplate.route_id]
      );

      if (routeRows.length === 0) {
        throw new Error('Route not found');
      }
      // Parse HH:MM:SS to milliseconds
      const [routeHours, routeMinutes, routeSeconds] = routeRows[0].estimated_duration.split(':').map(Number);
      durationMs = ((routeHours * 60 + routeMinutes) * 60 + routeSeconds) * 1000;
    }

    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      if (daysOfWeek.includes(day.getDay())) {
        const departureTime = new Date(day);
        departureTime.setHours(hours, minutes, 0, 0);
        const arrivalTime = new Date(departureTime.getTime() + durationMs);

        const [result] = await pool.query(`
          INSERT INTO flights (
            flight_number, route_id, aircraft_id, 
            departure_time, arrival_time, status, gate
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          flightTemplate.flight_number,
          flightTemplate.route_id,
          flightTemplate.aircraft_id,
          formatMySQLDateTime(departureTime),
          formatMySQLDateTime(arrivalTime),
          flightTemplate.status || 'scheduled',
          flightTemplate.gate || null
        ]);
        
        createdFlightIds.push(result.insertId);
      }
    }
    
    return createdFlightIds;
  } catch (error) {
    logger.error(`Error creating recurring flights: ${error.message}`);
    throw error;
  }
};

/**
 * Check for schedule conflicts
 * @param {number} aircraftId - Aircraft ID
 * @param {Date} startDate - Period start date
 * @param {Date} endDate - Period end date
 * @returns {Promise<Array>} Conflicting flights
 */
exports.checkScheduleConflicts = async (aircraftId, startDate, endDate) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f1.flight_id AS flight1_id,
        f1.flight_number AS flight1_number,
        f1.departure_time AS flight1_departure,
        f1.arrival_time AS flight1_arrival,
        f2.flight_id AS flight2_id,
        f2.flight_number AS flight2_number,
        f2.departure_time AS flight2_departure,
        f2.arrival_time AS flight2_arrival
      FROM flights f1
      JOIN flights f2 ON f1.aircraft_id = f2.aircraft_id
        AND f1.flight_id < f2.flight_id
        AND (
          (f1.departure_time <= f2.departure_time AND f1.arrival_time > f2.departure_time)
          OR
          (f2.departure_time <= f1.departure_time AND f2.arrival_time > f1.departure_time)
        )
      WHERE f1.aircraft_id = ?
        AND f1.status NOT IN ('canceled', 'arrived')
        AND f2.status NOT IN ('canceled', 'arrived')
        AND (
          (f1.departure_time BETWEEN ? AND ?)
          OR
          (f2.departure_time BETWEEN ? AND ?)
        )
      ORDER BY f1.departure_time
    `, [aircraftId, startDate, endDate, startDate, endDate]);
    
    return rows;
  } catch (error) {
    logger.error(`Error checking schedule conflicts: ${error.message}`);
    throw error;
  }
};

/**
 * Get flights that need to be canceled (no tickets)
 * @param {number} hoursThreshold - Hours before departure to check
 * @returns {Promise<Array>} Flights to cancel
 */
exports.getEmptyFlightsForCancellation = async (hoursThreshold = 24) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.flight_id,
        f.flight_number,
        f.departure_time,
        r.origin,
        r.destination,
        (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id) AS ticket_count
      FROM flights f
      JOIN routes r ON f.route_id = r.route_id
      WHERE f.departure_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? HOUR)
      AND f.status = 'scheduled'
      AND (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id) = 0
    `, [hoursThreshold]);
    
    return rows;
  } catch (error) {
    logger.error(`Error getting empty flights: ${error.message}`);
    throw error;
  }
};
