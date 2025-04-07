const { pool } = require('../config/database');
const Flight = require('./flightModel');

/**
 * Get all tickets with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated tickets
 */
exports.getAllTickets = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.query(`
    SELECT 
      t.ticket_id,
      t.seat_number,
      t.class,
      t.price,
      t.user_id,
      t.flight_id,
      t.booking_date,
      t.payment_status,
      f.flight_number,
      f.departure_time,
      f.arrival_time,
      r.origin,
      r.destination,
      CONCAT(u.first_name, ' ', u.last_name) AS passenger_name,
      u.passport_number
    FROM tickets t
    JOIN flights f ON t.flight_id = f.flight_id
    JOIN routes r ON f.route_id = r.route_id
    JOIN users u ON t.user_id = u.user_id
    ORDER BY t.booking_date DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  
  const [countRows] = await pool.query('SELECT COUNT(*) as count FROM tickets');
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
 * Get ticket by ID
 * @param {number} id - Ticket ID
 * @returns {Promise<Object>} Ticket details
 */
exports.getTicketById = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      t.ticket_id,
      t.user_id,
      t.flight_id,
      t.seat_number,
      t.class,
      t.price,
      t.booking_date,
      t.payment_status,
      f.flight_number,
      f.departure_time,
      f.arrival_time,
      f.status AS flight_status,
      f.gate,
      f.base_price,
      r.origin,
      r.destination,
      CONCAT(u.first_name, ' ', u.last_name) AS passenger_name,
      u.passport_number,
      a.model AS aircraft_model,
      a.registration_number,
      c.name AS crew_name
    FROM tickets t
    JOIN flights f ON t.flight_id = f.flight_id
    JOIN routes r ON f.route_id = r.route_id
    JOIN users u ON t.user_id = u.user_id
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    LEFT JOIN crews c ON a.crew_id = c.crew_id
    WHERE t.ticket_id = ?
  `, [id]);
  
  return rows[0];
};

/**
 * Generate printable ticket
 * @param {number} id - Ticket ID
 * @returns {Promise<Object>} Formatted ticket
 */
exports.generateTicket = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      t.ticket_id,
      t.seat_number,
      t.class,
      t.price,
      f.flight_number,
      f.departure_time,
      f.arrival_time,
      r.origin,
      r.destination,
      a.model AS aircraft_model,
      CONCAT(u.first_name, ' ', u.last_name) AS passenger_name,
      u.passport_number,
      a.registration_number AS aircraft_registration,
      f.gate,
      c.name AS crew_name
    FROM 
      tickets t
    JOIN 
      flights f ON t.flight_id = f.flight_id
    JOIN 
      routes r ON f.route_id = r.route_id
    JOIN 
      aircraft a ON f.aircraft_id = a.aircraft_id
    JOIN 
      users u ON t.user_id = u.user_id
    LEFT JOIN
      crews c ON a.crew_id = c.crew_id
    WHERE 
      t.ticket_id = ?
  `, [id]);
  
  return rows[0];
};

/**
 * Get tickets by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Array>} User's tickets
 */
exports.getTicketsByUser = async (userId) => {
  const [rows] = await pool.query(`
    SELECT 
      t.ticket_id,
      t.seat_number,
      t.class,
      t.price,
      t.booking_date,
      t.payment_status,
      f.flight_number,
      f.departure_time,
      f.arrival_time,
      r.origin,
      r.destination,
      f.status AS flight_status
    FROM tickets t
    JOIN flights f ON t.flight_id = f.flight_id
    JOIN routes r ON f.route_id = r.route_id
    WHERE t.user_id = ?
    ORDER BY f.departure_time
  `, [userId]);
  
  return rows;
};

/**
 * Get tickets by flight ID
 * @param {number} flightId - Flight ID
 * @returns {Promise<Array>} Flight's tickets
 */
exports.getTicketsByFlight = async (flightId) => {
  const [rows] = await pool.query(`
    SELECT 
      t.ticket_id,
      t.seat_number,
      t.class,
      t.price,
      CONCAT(u.first_name, ' ', u.last_name) AS passenger_name,
      u.passport_number,
      t.payment_status
    FROM tickets t
    JOIN users u ON t.user_id = u.user_id
    WHERE t.flight_id = ?
    ORDER BY t.seat_number
  `, [flightId]);
  
  return rows;
};

/**
 * Get tickets by flight number
 * @param {string} flightNumber - Flight number
 * @returns {Promise<Array>} Matching tickets
 */
exports.getTicketsByFlightNumber = async (flightNumber) => {
  const [rows] = await pool.query(`
    SELECT 
      t.ticket_id,
      t.seat_number,
      t.class,
      t.price,
      t.booking_date,
      t.payment_status,
      f.flight_number,
      f.departure_time,
      f.arrival_time,
      r.origin,
      r.destination,
      f.status AS flight_status,
      CONCAT(u.first_name, ' ', u.last_name) AS passenger_name,
      u.passport_number
    FROM tickets t
    JOIN flights f ON t.flight_id = f.flight_id
    JOIN routes r ON f.route_id = r.route_id
    JOIN users u ON t.user_id = u.user_id
    WHERE f.flight_number = ?
    ORDER BY t.seat_number
  `, [flightNumber]);
  
  return rows;
};

/**
 * Get tickets by passenger passport number
 * @param {string} passportNumber - Passport number
 * @returns {Promise<Array>} Matching tickets
 */
exports.getTicketsByPassportNumber = async (passportNumber) => {
  const [rows] = await pool.query(`
    SELECT 
      t.ticket_id,
      t.seat_number,
      t.class,
      t.price,
      t.booking_date,
      t.payment_status,
      f.flight_number,
      f.departure_time,
      f.arrival_time,
      r.origin,
      r.destination,
      f.status AS flight_status,
      CONCAT(u.first_name, ' ', u.last_name) AS passenger_name,
      u.passport_number
    FROM tickets t
    JOIN flights f ON t.flight_id = f.flight_id
    JOIN routes r ON f.route_id = r.route_id
    JOIN users u ON t.user_id = u.user_id
    WHERE u.passport_number = ?
    ORDER BY f.departure_time
  `, [passportNumber]);
  
  return rows;
};

/**
 * Generate ticket sales report
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Sales report
 */
exports.generateTicketSalesReport = async (startDate, endDate) => {
  const [rows] = await pool.query(`
    SELECT 
      f.flight_number,
      r.origin,
      r.destination,
      DATE(f.departure_time) AS flight_date,
      COUNT(t.ticket_id) AS tickets_sold,
      SUM(t.price) AS total_revenue,
      t.class AS ticket_class,
      a.capacity AS total_capacity,
      ROUND((COUNT(t.ticket_id) / a.capacity * 100), 2) AS occupancy_percentage,
      f.base_price
    FROM 
      tickets t
    JOIN 
      flights f ON t.flight_id = f.flight_id
    JOIN 
      routes r ON f.route_id = r.route_id
    JOIN 
      aircraft a ON f.aircraft_id = a.aircraft_id
    WHERE 
      DATE(t.booking_date) BETWEEN ? AND ? 
      AND t.payment_status = 'completed'
    GROUP BY 
      f.flight_id, t.class
    ORDER BY 
      f.departure_time, t.class
  `, [startDate, endDate]);
  
  return rows;
};

/**
 * Book a new ticket
 * @param {Object} ticketData - Ticket data
 * @returns {Promise<number>} ID of the created ticket
 */
exports.createTicket = async (ticketData) => {
  let {
    user_id,
    flight_id,
    seat_number,
    class: ticketClass = 'economy',
    price,
    payment_status = 'pending'
  } = ticketData;
  
  // If price is not provided, calculate it based on flight base price and class
  if (!price) {
    price = await Flight.calculateTicketPrice(flight_id, ticketClass);
  }
  
  const [result] = await pool.query(`
    INSERT INTO tickets (
      user_id, flight_id, seat_number, 
      class, price, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [
    user_id,
    flight_id,
    seat_number,
    ticketClass,
    price,
    payment_status
  ]);
  
  return result.insertId;
};

/**
 * Update a ticket
 * @param {number} id - Ticket ID
 * @param {Object} ticketData - Ticket data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updateTicket = async (id, ticketData) => {
  const {
    seat_number,
    class: ticketClass,
    price,
    payment_status
  } = ticketData;
  
  // If updating the class and not providing a price, we need to recalculate
  let updatedPrice = price;
  if (ticketClass && !price) {
    // Get the flight ID from the ticket
    const [ticketRows] = await pool.query(
      'SELECT flight_id FROM tickets WHERE ticket_id = ?',
      [id]
    );
    
    if (ticketRows.length > 0) {
      updatedPrice = await Flight.calculateTicketPrice(ticketRows[0].flight_id, ticketClass);
    }
  }
  
  const [result] = await pool.query(`
    UPDATE tickets
    SET
      seat_number = COALESCE(?, seat_number),
      class = COALESCE(?, class),
      price = COALESCE(?, price),
      payment_status = COALESCE(?, payment_status)
    WHERE ticket_id = ?
  `, [
    seat_number,
    ticketClass,
    updatedPrice,
    payment_status,
    id
  ]);
  
  return result.affectedRows > 0;
};

/**
 * Delete a ticket
 * @param {number} id - Ticket ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deleteTicket = async (id) => {
  const [result] = await pool.query('DELETE FROM tickets WHERE ticket_id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Check if seat is available on flight
 * @param {number} flightId - Flight ID
 * @param {string} seatNumber - Seat number
 * @param {number} excludeTicketId - Ticket ID to exclude from check
 * @returns {Promise<boolean>} Whether seat is available
 */
exports.isSeatAvailable = async (flightId, seatNumber, excludeTicketId = null) => {
  let query = 'SELECT COUNT(*) AS count FROM tickets WHERE flight_id = ? AND seat_number = ?';
  const params = [flightId, seatNumber];
  
  if (excludeTicketId) {
    query += ' AND ticket_id != ?';
    params.push(excludeTicketId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count === 0;
};

/**
 * Update ticket payment status
 * @param {number} id - Ticket ID
 * @param {string} status - New payment status
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updatePaymentStatus = async (id, status) => {
  const [result] = await pool.query(
    'UPDATE tickets SET payment_status = ? WHERE ticket_id = ?', 
    [status, id]
  );
  
  return result.affectedRows > 0;
};

/**
 * Get available seats for a flight
 * @param {number} flightId - Flight ID
 * @returns {Promise<Array>} Available seats
 */
exports.getAvailableSeats = async (flightId) => {
  // First get the aircraft capacity for this flight
  const [flightRows] = await pool.query(`
    SELECT 
      a.capacity,
      a.model
    FROM flights f
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    WHERE f.flight_id = ?
  `, [flightId]);
  
  if (flightRows.length === 0) {
    throw new Error('Flight not found');
  }
  
  const capacity = flightRows[0].capacity;
  const model = flightRows[0].model;
  
  // Get currently booked seats
  const [bookedRows] = await pool.query(`
    SELECT seat_number
    FROM tickets
    WHERE flight_id = ?
  `, [flightId]);
  
  const bookedSeats = bookedRows.map(row => row.seat_number);
  
  // Generate all possible seats based on aircraft model and capacity
  const allSeats = generateSeatMap(model, capacity);
  
  // Filter out booked seats
  return allSeats.filter(seat => !bookedSeats.includes(seat));
};

/**
 * Helper function to generate seat map based on aircraft model and capacity
 * @param {string} model - Aircraft model
 * @param {number} capacity - Aircraft capacity
 * @returns {Array} Array of seat numbers
 */
function generateSeatMap(model, capacity) {
  const seats = [];
  
  // Different aircraft models have different seating layouts
  // This is a simplified example
  
  // Rows typically go from 1 to N
  const rows = Math.ceil(capacity / 6); // Assuming 6 seats per row
  
  // Seat letters are typically A-F for narrow-body aircraft
  const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // Some aircraft models might have different layouts
  if (model.includes('A320') || model.includes('737')) {
    // Standard 3-3 configuration
    for (let row = 1; row <= rows; row++) {
      for (const letter of seatLetters) {
        seats.push(`${row}${letter}`);
        
        // Stop if we've reached capacity
        if (seats.length >= capacity) {
          return seats;
        }
      }
    }
  } else if (model.includes('E190')) {
    // 2-2 configuration
    const e190Letters = ['A', 'B', 'C', 'D']; // 2-2 configuration
    for (let row = 1; row <= rows; row++) {
      for (const letter of e190Letters) {
        seats.push(`${row}${letter}`);
        
        if (seats.length >= capacity) {
          return seats;
        }
      }
    }
  } else {
    // Generic configuration
    for (let row = 1; row <= rows; row++) {
      for (const letter of seatLetters) {
        seats.push(`${row}${letter}`);
        
        if (seats.length >= capacity) {
          return seats;
        }
      }
    }
  }
  
  return seats;
}