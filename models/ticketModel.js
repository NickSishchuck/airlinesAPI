// TODO Change passengers to users since I merged those two tables

const { pool } = require('../config/database');

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
      r.origin,
      r.destination,
      CONCAT(u.first_name, ' ', u.last_name) AS passenger_name,
      u.passport_number,
      a.model AS aircraft_model,
      a.registration_number
    FROM tickets t
    JOIN flights f ON t.flight_id = f.flight_id
    JOIN routes r ON f.route_id = r.route_id
    JOIN users u ON t.user_id = u.user_id
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
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
  const [rows] = await pool.query(`CALL generate_ticket(?)`, [id]);
  return rows[0][0];
};

/**
 * Get tickets by passenger ID
 * @param {number} passengerId - Passenger ID
 * @returns {Promise<Array>} Passenger's tickets
 */
exports.getTicketsByPassenger = async (passengerId) => {
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
  `, [passengerId]);
  
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
      CONCAT(p.first_name, ' ', p.last_name) AS passenger_name,
      p.passport_number,
      t.payment_status
    FROM tickets t
    JOIN users u ON t.user_id = u.user_id
    WHERE t.flight_id = ?
    ORDER BY t.seat_number
  `, [flightId]);
  
  return rows;
};

/**
 * Generate ticket sales report
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Sales report
 */
exports.generateTicketSalesReport = async (startDate, endDate) => {
  const [rows] = await pool.query(`CALL generate_ticket_sales_report(?, ?)`, 
    [startDate, endDate]);
  
  return rows[0];
};

/**
 * Book a new ticket
 * @param {Object} ticketData - Ticket data
 * @returns {Promise<number>} ID of the created ticket
 */
exports.createTicket = async (ticketData) => {
  const {
    passenger_id,
    flight_id,
    seat_number,
    class: ticketClass = 'economy',
    price,
    payment_status = 'pending'
  } = ticketData;
  
  const [result] = await pool.query(`
    INSERT INTO tickets (
      user_id, flight_id, seat_number, 
      class, price, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [
    passenger_id,
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
  
  const [result] = await pool.query(`
    UPDATE tickets
    SET
      seat_number = COALESCE(?, seat_number),
      class = COALESCE(?, class),
      price = COALESCE(?, price),
      payment_status = COALESCE(?, payment_status),
      updated_at = CURRENT_TIMESTAMP
    WHERE ticket_id = ?
  `, [
    seat_number,
    ticketClass,
    price,
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
