const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Initialize seats for a flight based on aircraft model and capacity
 * @param {number} flightId - Flight ID
 * @param {number} aircraftId - Aircraft ID
 * @returns {Promise<boolean>} Whether initialization was successful
 */
exports.initializeFlightSeats = async (flightId, aircraftId) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get aircraft details
    const [aircraftRows] = await connection.query(
      'SELECT model, capacity FROM aircraft WHERE aircraft_id = ?',
      [aircraftId]
    );
    
    if (aircraftRows.length === 0) {
      throw new Error('Aircraft not found');
    }
    
    const aircraft = aircraftRows[0];
    
    // Calculate seat distribution by class based on aircraft model
    const seatDistribution = calculateSeatDistribution(aircraft.model, aircraft.capacity);
    
    // Generate seat layouts for each class
    const classLayouts = generateSeatLayouts(seatDistribution, aircraft.model);
    
    // Insert seat layouts for each class into flight_seats table
    for (const [className, seatLayout] of Object.entries(classLayouts)) {
      await connection.query(
        `INSERT INTO flight_seats 
        (flight_id, class, available_seats, booked_seats) 
        VALUES (?, ?, ?, ?)`,
        [
          flightId,
          className,
          JSON.stringify(seatLayout),
          JSON.stringify([]) // Initially, no seats are booked
        ]
      );
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    logger.error(`Error initializing flight seats: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get available seats for a flight by class
 * @param {number} flightId - Flight ID
 * @param {string} seatClass - Seat class
 * @returns {Promise<Array>} Available seats
 */
exports.getAvailableSeatsByClass = async (flightId, seatClass) => {
  const [rows] = await pool.query(
    'SELECT available_seats FROM flight_seats WHERE flight_id = ? AND class = ?',
    [flightId, seatClass]
  );
  
  if (rows.length === 0) {
    return [];
  }
  
  return JSON.parse(rows[0].available_seats);
};

/**
 * Get booked seats for a flight by class
 * @param {number} flightId - Flight ID
 * @param {string} seatClass - Seat class
 * @returns {Promise<Array>} Booked seats
 */
exports.getBookedSeatsByClass = async (flightId, seatClass) => {
  const [rows] = await pool.query(
    'SELECT booked_seats FROM flight_seats WHERE flight_id = ? AND class = ?',
    [flightId, seatClass]
  );
  
  if (rows.length === 0) {
    return [];
  }
  
  return JSON.parse(rows[0].booked_seats);
};

/**
 * Get complete seat map for a flight
 * @param {number} flightId - Flight ID
 * @returns {Promise<Object>} Seat map by class
 */
exports.getFlightSeatMap = async (flightId) => {
  const [rows] = await pool.query(
    'SELECT class, available_seats, booked_seats FROM flight_seats WHERE flight_id = ?',
    [flightId]
  );
  
  const seatMap = {};
  
  rows.forEach(row => {
    seatMap[row.class] = {
      available: JSON.parse(row.available_seats),
      booked: JSON.parse(row.booked_seats)
    };
  });
  
  return seatMap;
};

/**
 * Check if a seat is available for booking
 * @param {number} flightId - Flight ID
 * @param {string} seatClass - Seat class
 * @param {string} seatNumber - Seat number
 * @returns {Promise<boolean>} Whether seat is available
 */
exports.isSeatAvailable = async (flightId, seatClass, seatNumber) => {
  const [rows] = await pool.query(
    'SELECT available_seats FROM flight_seats WHERE flight_id = ? AND class = ?',
    [flightId, seatClass]
  );
  
  if (rows.length === 0) {
    return false;
  }
  
  const availableSeats = JSON.parse(rows[0].available_seats);
  return availableSeats.includes(seatNumber);
};

/**
 * Book a seat (move from available to booked)
 * @param {number} flightId - Flight ID
 * @param {string} seatClass - Seat class
 * @param {string} seatNumber - Seat number
 * @returns {Promise<boolean>} Whether booking was successful
 */
exports.bookSeat = async (flightId, seatClass, seatNumber) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get current seat arrays
    const [rows] = await connection.query(
      'SELECT available_seats, booked_seats FROM flight_seats WHERE flight_id = ? AND class = ? FOR UPDATE',
      [flightId, seatClass]
    );
    
    if (rows.length === 0) {
      throw new Error('Seat class not found for this flight');
    }
    
    const availableSeats = JSON.parse(rows[0].available_seats);
    const bookedSeats = JSON.parse(rows[0].booked_seats);
    
    // Check if seat is available
    const seatIndex = availableSeats.indexOf(seatNumber);
    if (seatIndex === -1) {
      throw new Error('Seat is not available');
    }
    
    // Remove from available and add to booked
    availableSeats.splice(seatIndex, 1);
    bookedSeats.push(seatNumber);
    
    // Update the database
    await connection.query(
      'UPDATE flight_seats SET available_seats = ?, booked_seats = ? WHERE flight_id = ? AND class = ?',
      [JSON.stringify(availableSeats), JSON.stringify(bookedSeats), flightId, seatClass]
    );
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    logger.error(`Error booking seat: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Release a seat (move from booked to available)
 * @param {number} flightId - Flight ID
 * @param {string} seatClass - Seat class
 * @param {string} seatNumber - Seat number
 * @returns {Promise<boolean>} Whether release was successful
 */
exports.releaseSeat = async (flightId, seatClass, seatNumber) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get current seat arrays
    const [rows] = await connection.query(
      'SELECT available_seats, booked_seats FROM flight_seats WHERE flight_id = ? AND class = ? FOR UPDATE',
      [flightId, seatClass]
    );
    
    if (rows.length === 0) {
      throw new Error('Seat class not found for this flight');
    }
    
    const availableSeats = JSON.parse(rows[0].available_seats);
    const bookedSeats = JSON.parse(rows[0].booked_seats);
    
    // Check if seat is booked
    const seatIndex = bookedSeats.indexOf(seatNumber);
    if (seatIndex === -1) {
      throw new Error('Seat is not currently booked');
    }
    
    // Remove from booked and add to available
    bookedSeats.splice(seatIndex, 1);
    availableSeats.push(seatNumber);
    
    // Sort available seats for consistency
    availableSeats.sort((a, b) => {
      // Sort by row number first, then by seat letter
      const rowA = parseInt(a.match(/\d+/)[0]);
      const rowB = parseInt(b.match(/\d+/)[0]);
      
      if (rowA !== rowB) {
        return rowA - rowB;
      }
      
      return a.localeCompare(b);
    });
    
    // Update the database
    await connection.query(
      'UPDATE flight_seats SET available_seats = ?, booked_seats = ? WHERE flight_id = ? AND class = ?',
      [JSON.stringify(availableSeats), JSON.stringify(bookedSeats), flightId, seatClass]
    );
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    logger.error(`Error releasing seat: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Validate woman only seat booking
 * @param {string} gender - Passenger gender
 * @returns {boolean} Whether booking is allowed
 */
exports.validateWomanOnlySeat = (gender) => {
  return gender && gender.toLowerCase() === 'female';
};

/**
 * Get all available seats for a flight (across all classes)
 * @param {number} flightId - Flight ID
 * @returns {Promise<Object>} Available seats by class
 */
exports.getAllAvailableSeats = async (flightId) => {
  const [rows] = await pool.query(
    'SELECT class, available_seats FROM flight_seats WHERE flight_id = ?',
    [flightId]
  );
  
  const availableSeats = {};
  
  rows.forEach(row => {
    availableSeats[row.class] = JSON.parse(row.available_seats);
  });
  
  return availableSeats;
};

/**
 * Reconfigure seat layout for a flight
 * @param {number} flightId - Flight ID
 * @param {Object} configuration - New configuration with class distribution
 * @returns {Promise<boolean>} Whether reconfiguration was successful
 */
exports.reconfigureFlightSeats = async (flightId, configuration) => {
  // This would be a more complex operation that would need to handle:
  // - Checking if tickets are already booked
  // - Potentially redistributing existing bookings
  // - Generating new seat layouts
  
  // For now, we'll implement a simpler version that only works for flights with no bookings
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if any seats are already booked
    const [bookingCheck] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM flight_seats 
       WHERE flight_id = ? 
       AND JSON_LENGTH(booked_seats) > 0`,
      [flightId]
    );
    
    if (bookingCheck[0].count > 0) {
      throw new Error('Cannot reconfigure flight with existing bookings');
    }
    
    // Get flight details to find the aircraft
    const [flightRows] = await connection.query(
      'SELECT aircraft_id FROM flights WHERE flight_id = ?',
      [flightId]
    );
    
    if (flightRows.length === 0) {
      throw new Error('Flight not found');
    }
    
    // Get aircraft details
    const [aircraftRows] = await connection.query(
      'SELECT model, capacity FROM aircraft WHERE aircraft_id = ?',
      [flightRows[0].aircraft_id]
    );
    
    if (aircraftRows.length === 0) {
      throw new Error('Aircraft not found');
    }
    
    const aircraft = aircraftRows[0];
    
    // Generate new seat layouts based on the provided configuration
    const classLayouts = generateCustomSeatLayouts(configuration, aircraft.model, aircraft.capacity);
    
    // Clear existing seat configuration
    await connection.query(
      'DELETE FROM flight_seats WHERE flight_id = ?',
      [flightId]
    );
    
    // Insert new seat layouts
    for (const [className, seatLayout] of Object.entries(classLayouts)) {
      await connection.query(
        `INSERT INTO flight_seats 
        (flight_id, class, available_seats, booked_seats) 
        VALUES (?, ?, ?, ?)`,
        [
          flightId,
          className,
          JSON.stringify(seatLayout),
          JSON.stringify([]) // All seats are available
        ]
      );
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    logger.error(`Error reconfiguring flight seats: ${error.message}`);
    throw error;
  } finally {
    connection.release();
  }
};

// ========== Helper Functions ==========

/**
 * Calculate seat distribution by class based on aircraft model and capacity
 * @param {string} aircraftModel - Aircraft model 
 * @param {number} totalCapacity - Total seat capacity
 * @returns {Object} Seat counts by class
 */
function calculateSeatDistribution(aircraftModel, totalCapacity) {
  // Default distribution percentages
  let firstClassPercent = 0.05;  // 5%
  let businessClassPercent = 0.15; // 15%
  let womanOnlyPercent = 0.10;   // 10%
  let economyClassPercent = 0.70; // 70%
  
  // Adjust for specific aircraft models
  if (aircraftModel.includes('A320') || aircraftModel.includes('737')) {
    // Narrow-body short/medium haul jets
    firstClassPercent = 0.08;
    businessClassPercent = 0.22;
    womanOnlyPercent = 0.10;
    economyClassPercent = 0.60;
  } else if (aircraftModel.includes('A330') || aircraftModel.includes('777')) {
    // Wide-body long haul jets
    firstClassPercent = 0.10;
    businessClassPercent = 0.25;
    womanOnlyPercent = 0.05;
    economyClassPercent = 0.60;
  } else if (aircraftModel.includes('CRJ') || aircraftModel.includes('E190')) {
    // Regional jets
    firstClassPercent = 0.05;
    businessClassPercent = 0.15;
    womanOnlyPercent = 0.05;
    economyClassPercent = 0.75;
  }
  
  // Calculate seat counts (ensuring we don't exceed total capacity)
  const firstClassSeats = Math.floor(totalCapacity * firstClassPercent);
  const businessClassSeats = Math.floor(totalCapacity * businessClassPercent);
  const womanOnlySeats = Math.floor(totalCapacity * womanOnlyPercent);
  
  // Economy gets the remainder to ensure total equals capacity
  const economyClassSeats = totalCapacity - (firstClassSeats + businessClassSeats + womanOnlySeats);
  
  return {
    first: firstClassSeats,
    business: businessClassSeats,
    economy: economyClassSeats,
    woman_only: womanOnlySeats
  };
}

/**
 * Generate seat layouts for each class
 * @param {Object} seatDistribution - Number of seats for each class
 * @param {string} aircraftModel - Aircraft model
 * @returns {Object} Seat layouts by class
 */
function generateSeatLayouts(seatDistribution, aircraftModel) {
  const layouts = {};
  
  // Standard seating configuration based on aircraft model
  let seatsPerRow = 6; // Default for narrow-body
  let firstClassRows = 0;
  let businessClassRows = 0;
  let womanOnlyRows = 0;
  
  // Determine seat letter configuration based on aircraft type
  let seatLetters = ['A', 'B', 'C', 'D', 'E', 'F']; // Default for narrow-body (3-3)
  
  if (aircraftModel.includes('A330') || aircraftModel.includes('777') || aircraftModel.includes('787')) {
    // Wide-body configuration (typically 2-4-2)
    seatsPerRow = 8;
    seatLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  } else if (aircraftModel.includes('CRJ') || aircraftModel.includes('E190') || aircraftModel.includes('E175')) {
    // Regional jet configuration (typically 2-2)
    seatsPerRow = 4;
    seatLetters = ['A', 'B', 'C', 'D'];
  }
  
  // Calculate rows needed for each class (rounding up)
  firstClassRows = Math.ceil(seatDistribution.first / seatsPerRow);
  businessClassRows = Math.ceil(seatDistribution.business / seatsPerRow);
  womanOnlyRows = Math.ceil(seatDistribution.woman_only / seatsPerRow);
  const economyClassRows = Math.ceil(seatDistribution.economy / seatsPerRow);
  
  // Generate seat numbers for each class
  layouts.first = generateSeatsForClass(1, firstClassRows, seatLetters, seatDistribution.first);
  layouts.business = generateSeatsForClass(firstClassRows + 1, firstClassRows + businessClassRows, seatLetters, seatDistribution.business);
  layouts.woman_only = generateSeatsForClass(firstClassRows + businessClassRows + 1, firstClassRows + businessClassRows + womanOnlyRows, seatLetters, seatDistribution.woman_only);
  layouts.economy = generateSeatsForClass(firstClassRows + businessClassRows + womanOnlyRows + 1, firstClassRows + businessClassRows + womanOnlyRows + economyClassRows, seatLetters, seatDistribution.economy);
  
  return layouts;
}

/**
 * Generate seat numbers for a specific class
 * @param {number} startRow - Starting row number
 * @param {number} endRow - Ending row number
 * @param {Array} seatLetters - Array of seat letters per row
 * @param {number} maxSeats - Maximum number of seats to generate
 * @returns {Array} Array of seat numbers
 */
function generateSeatsForClass(startRow, endRow, seatLetters, maxSeats) {
  const seats = [];
  let seatCount = 0;
  
  for (let row = startRow; row <= endRow; row++) {
    for (const letter of seatLetters) {
      seats.push(`${row}${letter}`);
      seatCount++;
      
      if (seatCount >= maxSeats) {
        return seats;
      }
    }
  }
  
  return seats;
}

/**
 * Generate custom seat layouts based on provided configuration
 * @param {Object} configuration - Seat count or percentage by class
 * @param {string} aircraftModel - Aircraft model
 * @param {number} totalCapacity - Total aircraft capacity
 * @returns {Object} Seat layouts by class
 */
function generateCustomSeatLayouts(configuration, aircraftModel, totalCapacity) {
  // Convert percentages to seat counts if necessary
  const seatDistribution = {};
  let totalConfigured = 0;
  
  for (const [className, value] of Object.entries(configuration)) {
    if (value < 1) {
      // Treat as percentage
      seatDistribution[className] = Math.floor(totalCapacity * value);
    } else {
      // Treat as absolute count
      seatDistribution[className] = Math.floor(value);
    }
    totalConfigured += seatDistribution[className];
  }
  
  // Ensure we don't exceed total capacity
  if (totalConfigured > totalCapacity) {
    // Scale down proportionally
    const scaleFactor = totalCapacity / totalConfigured;
    for (const className in seatDistribution) {
      seatDistribution[className] = Math.floor(seatDistribution[className] * scaleFactor);
    }
  }
  
  // Ensure all classes are represented
  const requiredClasses = ['first', 'business', 'economy', 'woman_only'];
  for (const className of requiredClasses) {
    if (!seatDistribution[className]) {
      seatDistribution[className] = 0;
    }
  }
  
  // Generate layouts using the standard function
  return generateSeatLayouts(seatDistribution, aircraftModel);
}