const { pool } = require('../config/database');
const Flight = require('./flightModel');
const FlightSeats = require('./flightSeatsModel');
const logger = require('../utils/logger');

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
      u.passport_number,
      u.gender
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
      u.gender,
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
      u.gender,
      a.registration_number AS aircraft_registration,
      f.gate
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
      u.gender,
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
      u.passport_number,
      u.gender
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
 * Generate ticket sales report
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Sales report
 */
exports.generateTicketSalesReport = async (startDate, endDate) => {
  const [rows] = await pool.query(`
    SELECT 
      f.flight_id,
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
  
  // For each flight, get the available seat counts by class
  const enhancedReport = [];
  
  for (const row of rows) {
    // Get seat availability for this flight
    const seatMap = await FlightSeats.getFlightSeatMap(row.flight_id);
    
    const enhancedRow = {
      ...row,
      available_seats: 0,
      seat_availability: {}
    };
    
    // Add seat availability details
    if (seatMap[row.ticket_class]) {
      enhancedRow.available_seats = seatMap[row.ticket_class].available.length;
      enhancedRow.seat_availability = {
        available: seatMap[row.ticket_class].available.length,
        booked: seatMap[row.ticket_class].booked.length,
        total: seatMap[row.ticket_class].available.length + seatMap[row.ticket_class].booked.length,
        occupancy_percentage: Math.round((seatMap[row.ticket_class].booked.length / 
          (seatMap[row.ticket_class].available.length + seatMap[row.ticket_class].booked.length)) * 100)
      };
    }
    
    enhancedReport.push(enhancedRow);
  }
  
  return enhancedReport;
};

/**
 * Book a new ticket
 * @param {Object} ticketData - Ticket data
 * @returns {Promise<number>} ID of the created ticket
 */
exports.createTicket = async (ticketData) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    let {
      user_id,
      flight_id,
      seat_number,
      class: ticketClass = 'economy',
      price,
      payment_status = 'pending'
    } = ticketData;
    
    // Check if the seat is available
    const seatAvailable = await FlightSeats.isSeatAvailable(flight_id, ticketClass, seat_number);
    if (!seatAvailable) {
      throw new Error('Seat is not available');
    }
    
    // If woman_only class, check if passenger is female
    if (ticketClass === 'woman_only') {
      // Get user's gender
      const [userRows] = await connection.query(
        'SELECT gender FROM users WHERE user_id = ?',
        [user_id]
      );
      
      if (userRows.length === 0) {
        throw new Error('User not found');
      }
      
      if (!FlightSeats.validateWomanOnlySeat(userRows[0].gender)) {
        throw new Error('Woman-only seats can only be booked by female passengers');
      }
    }
    
    // If price is not provided, calculate it based on flight base price and class multiplier
    if (!price) {
      const [flightRows] = await connection.query(
        `SELECT 
          base_price, 
          first_class_multiplier, 
          business_class_multiplier, 
          economy_class_multiplier, 
          woman_only_multiplier 
        FROM flights 
        WHERE flight_id = ?`,
        [flight_id]
      );
      
      if (flightRows.length === 0) {
        throw new Error('Flight not found');
      }
      
      const flight = flightRows[0];
      const multiplierField = `${ticketClass}_multiplier`;
      price = flight.base_price * flight[multiplierField];
    }
    
    // Book the seat in the flight_seats table
    await FlightSeats.bookSeat(flight_id, ticketClass, seat_number);
    
    // Create the ticket
    const [result] = await connection.query(`
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
    
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    logger.error(`Error creating ticket: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update a ticket
 * @param {number} id - Ticket ID
 * @param {Object} ticketData - Ticket data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updateTicket = async (id, ticketData) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get current ticket details
    const [ticketRows] = await connection.query(
      'SELECT flight_id, class, seat_number FROM tickets WHERE ticket_id = ?',
      [id]
    );
    
    if (ticketRows.length === 0) {
      throw new Error('Ticket not found');
    }
    
    const currentTicket = ticketRows[0];
    const {
      seat_number,
      class: ticketClass,
      price,
      payment_status
    } = ticketData;
    
    let finalSeatNumber = seat_number || currentTicket.seat_number;
    let finalTicketClass = ticketClass || currentTicket.class;
    let finalPrice = price;
    
    // If changing seat or class, we need to handle seat availability
    if ((seat_number && seat_number !== currentTicket.seat_number) || 
        (ticketClass && ticketClass !== currentTicket.class)) {
      
      // If changing class, need to validate woman_only restrictions
      if (ticketClass === 'woman_only' && ticketClass !== currentTicket.class) {
        // Get user's gender
        const [userRows] = await connection.query(
          'SELECT u.gender FROM tickets t JOIN users u ON t.user_id = u.user_id WHERE t.ticket_id = ?',
          [id]
        );
        
        if (!FlightSeats.validateWomanOnlySeat(userRows[0].gender)) {
          throw new Error('Woman-only seats can only be booked by female passengers');
        }
      }
      
      // Check if the new seat is available
      if (finalSeatNumber !== currentTicket.seat_number || finalTicketClass !== currentTicket.class) {
        const seatAvailable = await FlightSeats.isSeatAvailable(
          currentTicket.flight_id, 
          finalTicketClass, 
          finalSeatNumber
        );
        
        if (!seatAvailable) {
          throw new Error('The requested seat is not available');
        }
        
        // Release the old seat
        await FlightSeats.releaseSeat(
          currentTicket.flight_id,
          currentTicket.class,
          currentTicket.seat_number
        );
        
        // Book the new seat
        await FlightSeats.bookSeat(
          currentTicket.flight_id,
          finalTicketClass,
          finalSeatNumber
        );
      }
    }
    
    // If updating the class and not providing a price, recalculate
    if (ticketClass && ticketClass !== currentTicket.class && !price) {
      // Get flight details for pricing
      const [flightRows] = await connection.query(
        `SELECT 
          base_price, 
          first_class_multiplier, 
          business_class_multiplier, 
          economy_class_multiplier, 
          woman_only_multiplier 
        FROM flights 
        WHERE flight_id = ?`,
        [currentTicket.flight_id]
      );
      
      if (flightRows.length > 0) {
        const flight = flightRows[0];
        const multiplierField = `${finalTicketClass}_multiplier`;
        finalPrice = flight.base_price * flight[multiplierField];
      }
    }
    
    // Update the ticket record
    const [result] = await connection.query(`
      UPDATE tickets
      SET
        seat_number = COALESCE(?, seat_number),
        class = COALESCE(?, class),
        price = COALESCE(?, price),
        payment_status = COALESCE(?, payment_status)
      WHERE ticket_id = ?
    `, [
      finalSeatNumber,
      finalTicketClass,
      finalPrice,
      payment_status,
      id
    ]);
    
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    logger.error(`Error updating ticket: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Delete a ticket
 * @param {number} id - Ticket ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deleteTicket = async (id) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get ticket details
    const [ticketRows] = await connection.query(
      'SELECT flight_id, class, seat_number FROM tickets WHERE ticket_id = ?',
      [id]
    );
    
    if (ticketRows.length === 0) {
      throw new Error('Ticket not found');
    }
    
    const ticket = ticketRows[0];
    
    // Release the seat
    await FlightSeats.releaseSeat(
      ticket.flight_id,
      ticket.class,
      ticket.seat_number
    );
    
    // Delete the ticket
    const [result] = await connection.query(
      'DELETE FROM tickets WHERE ticket_id = ?', 
      [id]
    );
    
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    logger.error(`Error deleting ticket: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Check if seat is available on flight (backward compatibility function)
 * @param {number} flightId - Flight ID
 * @param {string} seatNumber - Seat number
 * @param {string} seatClass - Seat class
 * @returns {Promise<boolean>} Whether seat is available
 */
exports.isSeatAvailable = async (flightId, seatNumber, seatClass = 'economy') => {
  return await FlightSeats.isSeatAvailable(flightId, seatClass, seatNumber);
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
 * Validate a seat for booking (checks if available and appropriate for the user)
 * @param {number} flightId - Flight ID
 * @param {string} seatNumber - Seat number
 * @param {string} seatClass - Seat class
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Validation result with seat status and any validation messages
 */
exports.validateSeatForBooking = async (flightId, seatNumber, seatClass, userId) => {
  try {
    // Check if the seat exists and is available
    const seatAvailable = await FlightSeats.isSeatAvailable(flightId, seatClass, seatNumber);
    
    if (!seatAvailable) {
      return {
        valid: false,
        message: 'This seat is not available'
      };
    }
    
    // If woman_only class, check gender
    if (seatClass === 'woman_only') {
      const [userRows] = await pool.query(
        'SELECT gender FROM users WHERE user_id = ?',
        [userId]
      );
      
      if (userRows.length === 0) {
        return {
          valid: false,
          message: 'User not found'
        };
      }
      
      if (!FlightSeats.validateWomanOnlySeat(userRows[0].gender)) {
        return {
          valid: false,
          message: 'Woman-only seats can only be booked by female passengers'
        };
      }
    }
    
    // If we made it here, seat is valid
    return {
      valid: true,
      message: 'Seat is available for booking'
    };
  } catch (error) {
    logger.error(`Error validating seat: ${error.message}`);
    return {
      valid: false,
      message: `Error validating seat: ${error.message}`
    };
  }
};

/**
 * Get available seats for a flight by class
 * @param {number} flightId - Flight ID
 * @param {string} seatClass - Optional class filter
 * @returns {Promise<Object>} Available seats by class
 */
exports.getAvailableSeatsByClass = async (flightId, seatClass = null) => {
  try {
    if (seatClass) {
      // Return seats for specific class
      const seats = await FlightSeats.getAvailableSeatsByClass(flightId, seatClass);
      return { [seatClass]: seats };
    } else {
      // Return all available seats by class
      return await FlightSeats.getAllAvailableSeats(flightId);
    }
  } catch (error) {
    logger.error(`Error getting available seats: ${error.message}`);
    throw error;
  }
};