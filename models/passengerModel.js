const { pool } = require("../config/database");

//TODO Rename the thing to userModel

/**
 * Get all passengers with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated passengers
 */
exports.getAllPassengers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `
    SELECT
      user_id,
      first_name,
      last_name,
      passport_number,
      nationality,
      date_of_birth,
      contact_number,
      email,
      created_at
    FROM users
    ORDER BY last_name, first_name
    LIMIT ? OFFSET ?
  `,
    [limit, offset],
  );

  const [countRows] = await pool.query("SELECT COUNT(*) as count FROM users");
  const count = countRows[0].count;

  return {
    data: rows,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalItems: count,
  };
};

/**
 * Get passenger by ID
 * @param {number} id - Passenger ID
 * @returns {Promise<Object>} Passenger details
 */
exports.getPassengerById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.user_id,
      u.first_name,
      u.last_name,
      u.passport_number,
      u.nationality,
      u.date_of_birth,
      u.contact_number,
      u.email,
      (SELECT COUNT(*) FROM tickets t WHERE t.user_id = u.user_id) AS ticket_count
    FROM users u
    WHERE u.user_id = ?
  `,
    [id],
  );

  return rows[0];
};

/**
 * Check if passport number already exists
 * @param {string} passportNumber - Passport number to check
 * @param {number} excludeId - Passenger ID to exclude from check
 * @returns {Promise<boolean>} Whether passport exists
 */
exports.passportExists = async (passportNumber, excludeId = null) => {
  let query = "SELECT COUNT(*) AS count FROM users WHERE passport_number = ?";
  const params = [passportNumber];

  if (excludeId) {
    query += " AND user_id != ?";
    params.push(excludeId);
  }

  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/**
 * Create a new passenger
 * @param {Object} passengerData - Passenger data
 * @returns {Promise<number>} ID of the created passenger
 */
exports.createPassenger = async (passengerData) => {
  const {
    first_name,
    last_name,
    passport_number,
    nationality,
    date_of_birth,
    contact_number,
    email,
  } = passengerData;

  const [result] = await pool.query(
    `
    INSERT INTO users (
      first_name, last_name, passport_number,
      nationality, date_of_birth, contact_number, email
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    [
      first_name,
      last_name,
      passport_number,
      nationality,
      date_of_birth,
      contact_number,
      email,
    ],
  );

  return result.insertId;
};

/**
 * Update a passenger
 * @param {number} id - Passenger ID
 * @param {Object} passengerData - Passenger data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updatePassenger = async (id, passengerData) => {
  const {
    first_name,
    last_name,
    passport_number,
    nationality,
    date_of_birth,
    contact_number,
    email,
  } = passengerData;

  const [result] = await pool.query(
    `
    UPDATE users
    SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      passport_number = COALESCE(?, passport_number),
      nationality = COALESCE(?, nationality),
      date_of_birth = COALESCE(?, date_of_birth),
      contact_number = COALESCE(?, contact_number),
      email = COALESCE(?, email)
    WHERE user_id = ?
  `,
    [
      first_name,
      last_name,
      passport_number,
      nationality,
      date_of_birth,
      contact_number,
      email,
      id,
    ],
  );

  return result.affectedRows > 0;
};

/**
 * Delete a passenger
 * @param {number} id - Passenger ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deletePassenger = async (id) => {
  const [result] = await pool.query("DELETE FROM users WHERE user_id = ?", [
    id,
  ]);
  return result.affectedRows > 0;
};

/**
 * Get passenger by passport number
 * @param {string} passportNumber - Passport number
 * @returns {Promise<Object>} Passenger details
 */
exports.getPassengerByPassport = async (passportNumber) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.user_id,
      u.first_name,
      u.last_name,
      u.passport_number,
      u.nationality,
      u.date_of_birth,
      u.contact_number,
      u.email,
      (SELECT COUNT(*) FROM tickets t WHERE t.user_id = u.user_id) AS ticket_count
    FROM users u
    WHERE u.passport_number = ?
  `,
    [passportNumber],
  );

  return rows[0];
};

/**
 * Search passengers by name or passport
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Matching passengers
 */
exports.searchPassengers = async (searchTerm) => {
  const [rows] = await pool.query(
    `
    SELECT
      user_id,
      first_name,
      last_name,
      passport_number,
      nationality,
      email
    FROM users
    WHERE
      CONCAT(first_name, ' ', last_name) LIKE ? OR
      passport_number LIKE ?
    ORDER BY last_name, first_name
    LIMIT 20
  `,
    [`%${searchTerm}%`, `%${searchTerm}%`],
  );

  return rows;
};
