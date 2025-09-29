const { pool } = require('../config/database');

/**
 * Get all crew members with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} role - Optional filter by role (captain, pilot, flight_attendant)
 * @returns {Promise<Object>} Paginated crew members
 */
exports.getAllCrewMembers = async (page = 1, limit = 10, role = null) => {
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT 
      cm.crew_member_id,
      cm.first_name,
      cm.last_name,
      cm.role,
      cm.license_number,
      cm.date_of_birth,
      cm.experience_years,
      cm.contact_number,
      cm.email,
      (SELECT COUNT(*) FROM crew_assignments ca WHERE ca.crew_member_id = cm.crew_member_id) AS crew_count
    FROM crew_members cm
  `;
  
  const params = [];
  
  if (role) {
    query += ` WHERE cm.role = ?`;
    params.push(role);
  }
  
  query += ` ORDER BY cm.last_name, cm.first_name
    LIMIT ? OFFSET ?`;
  
  params.push(limit, offset);
  
  const [rows] = await pool.query(query, params);
  
  let countQuery = 'SELECT COUNT(*) as count FROM crew_members';
  const countParams = [];
  
  if (role) {
    countQuery += ' WHERE role = ?';
    countParams.push(role);
  }
  
  const [countRows] = await pool.query(countQuery, countParams);
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
 * Get crew member by ID
 * @param {number} id - Crew member ID
 * @returns {Promise<Object>} Crew member details
 */
exports.getCrewMemberById = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      cm.crew_member_id,
      cm.first_name,
      cm.last_name,
      cm.role,
      cm.license_number,
      cm.date_of_birth,
      cm.experience_years,
      cm.contact_number,
      cm.email,
      (SELECT COUNT(*) FROM crew_assignments ca WHERE ca.crew_member_id = cm.crew_member_id) AS crew_count
    FROM crew_members cm
    WHERE cm.crew_member_id = ?
  `, [id]);
  
  return rows[0];
};

/**
 * Search crew members by last name
 * @param {string} lastName - Last name to search for
 * @returns {Promise<Array>} Matching crew members
 */
exports.searchByLastName = async (lastName) => {
  const [rows] = await pool.query(`
    SELECT 
      cm.crew_member_id,
      cm.first_name,
      cm.last_name,
      cm.role,
      cm.license_number,
      cm.date_of_birth,
      cm.experience_years,
      cm.contact_number,
      cm.email,
      (SELECT COUNT(*) FROM crew_assignments ca WHERE ca.crew_member_id = cm.crew_member_id) AS crew_count
    FROM crew_members cm
    WHERE cm.last_name = ?
  `, [lastName]);
  
  return rows;
};

/**
 * Check if license number already exists
 * @param {string} licenseNumber - License to check
 * @param {number} excludeId - Crew member ID to exclude from check
 * @returns {Promise<boolean>} Whether license exists
 */
exports.licenseExists = async (licenseNumber, excludeId = null) => {
  // Skip check if license is null or empty (for flight attendants)
  if (!licenseNumber) {
    return false;
  }
  
  let query = 'SELECT COUNT(*) AS count FROM crew_members WHERE license_number = ?';
  const params = [licenseNumber];
  
  if (excludeId) {
    query += ' AND crew_member_id != ?';
    params.push(excludeId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows[0].count > 0;
};

/**
 * Create a new crew member
 * @param {Object} crewMemberData - Crew member data
 * @returns {Promise<number>} ID of the created crew member
 */
exports.createCrewMember = async (crewMemberData) => {
  const {
    first_name,
    last_name,
    role,
    license_number,
    date_of_birth,
    experience_years,
    contact_number,
    email
  } = crewMemberData;
  
  const [result] = await pool.query(`
    INSERT INTO crew_members (
      first_name, last_name, role, license_number, 
      date_of_birth, experience_years, contact_number, email
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    first_name,
    last_name,
    role,
    license_number,
    date_of_birth,
    experience_years,
    contact_number,
    email
  ]);
  
  return result.insertId;
};

/**
 * Update a crew member
 * @param {number} id - Crew member ID
 * @param {Object} crewMemberData - Crew member data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updateCrewMember = async (id, crewMemberData) => {
  const {
    first_name,
    last_name,
    role,
    license_number,
    date_of_birth,
    experience_years,
    contact_number,
    email
  } = crewMemberData;
  
  const [result] = await pool.query(`
    UPDATE crew_members
    SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      role = COALESCE(?, role),
      license_number = COALESCE(?, license_number),
      date_of_birth = COALESCE(?, date_of_birth),
      experience_years = COALESCE(?, experience_years),
      contact_number = COALESCE(?, contact_number),
      email = COALESCE(?, email)
    WHERE crew_member_id = ?
  `, [
    first_name,
    last_name,
    role,
    license_number,
    date_of_birth,
    experience_years,
    contact_number,
    email,
    id
  ]);
  
  return result.affectedRows > 0;
};

/**
 * Delete a crew member
 * @param {number} id - Crew member ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deleteCrewMember = async (id) => {
  const [assignments] = await pool.query(
    'SELECT COUNT(*) AS count FROM crew_assignments WHERE crew_member_id = ?',
    [id]
  );
  
  if (assignments[0].count > 0) {
    throw new Error('Cannot delete crew member who is assigned to a crew');
  }
  
  const [result] = await pool.query('DELETE FROM crew_members WHERE crew_member_id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Get assigned crews for a crew member
 * @param {number} crewMemberId - Crew member ID
 * @returns {Promise<Array>} Crews this member is assigned to
 */
exports.getCrewMemberAssignments = async (crewMemberId) => {
  const [rows] = await pool.query(`
    SELECT 
      c.crew_id,
      c.name,
      c.status,
      (SELECT COUNT(*) FROM crew_assignments ca2 WHERE ca2.crew_id = c.crew_id) AS member_count
    FROM crews c
    JOIN crew_assignments ca ON c.crew_id = ca.crew_id
    WHERE ca.crew_member_id = ?
  `, [crewMemberId]);
  
  return rows;
};

/**
 * Get flights for a crew member
 * @param {number} crewMemberId - Crew member ID
 * @returns {Promise<Array>} Flights managed by this crew member
 */
exports.getCrewMemberFlights = async (crewMemberId) => {
  const [rows] = await pool.query(`
    SELECT 
      f.flight_id,
      f.flight_number,
      r.origin,
      r.destination,
      f.departure_time,
      f.arrival_time,
      f.status,
      a.model AS aircraft_model,
      a.registration_number
    FROM flights f
    JOIN routes r ON f.route_id = r.route_id
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    JOIN crews c ON a.crew_id = c.crew_id
    JOIN crew_assignments ca ON c.crew_id = ca.crew_id
    WHERE ca.crew_member_id = ?
    ORDER BY f.departure_time
  `, [crewMemberId]);
  
  return rows;
};
