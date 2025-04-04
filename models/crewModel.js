const { pool } = require('../config/database');

/**
 * Get all crews with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} status - Optional filter by status (active, off-duty)
 * @returns {Promise<Object>} Paginated crews
 */
exports.getAllCrews = async (page = 1, limit = 10, status = null) => {
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT 
      c.crew_id,
      c.name,
      c.status,
      (SELECT COUNT(*) FROM crew_assignments ca WHERE ca.crew_id = c.crew_id) AS member_count,
      (SELECT COUNT(*) FROM aircraft a WHERE a.crew_id = c.crew_id) AS aircraft_count
    FROM crews c
  `;
  
  const params = [];
  
  if (status) {
    query += ` WHERE c.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY c.name
    LIMIT ? OFFSET ?`;
  
  params.push(limit, offset);
  
  const [rows] = await pool.query(query, params);
  
  // Get total count with the same filter
  let countQuery = 'SELECT COUNT(*) as count FROM crews';
  const countParams = [];
  
  if (status) {
    countQuery += ' WHERE status = ?';
    countParams.push(status);
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
 * Get crew by ID
 * @param {number} id - Crew ID
 * @returns {Promise<Object>} Crew details
 */
exports.getCrewById = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      c.crew_id,
      c.name,
      c.status,
      (SELECT COUNT(*) FROM crew_assignments ca WHERE ca.crew_id = c.crew_id) AS member_count,
      (SELECT COUNT(*) FROM aircraft a WHERE a.crew_id = c.crew_id) AS aircraft_count
    FROM crews c
    WHERE c.crew_id = ?
  `, [id]);
  
  return rows[0];
};

/**
 * Create a new crew
 * @param {Object} crewData - Crew data
 * @returns {Promise<number>} ID of the created crew
 */
exports.createCrew = async (crewData) => {
  const {
    name,
    status = 'active'
  } = crewData;
  
  const [result] = await pool.query(`
    INSERT INTO crews (name, status) VALUES (?, ?)
  `, [name, status]);
  
  return result.insertId;
};

/**
 * Update a crew
 * @param {number} id - Crew ID
 * @param {Object} crewData - Crew data to update
 * @returns {Promise<boolean>} Whether update was successful
 */
exports.updateCrew = async (id, crewData) => {
  const { name, status } = crewData;
  
  const [result] = await pool.query(`
    UPDATE crews
    SET
      name = COALESCE(?, name),
      status = COALESCE(?, status)
    WHERE crew_id = ?
  `, [name, status, id]);
  
  return result.affectedRows > 0;
};

/**
 * Delete a crew
 * @param {number} id - Crew ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
exports.deleteCrew = async (id) => {
  // Check if crew is assigned to any aircraft
  const [aircraft] = await pool.query(
    'SELECT COUNT(*) AS count FROM aircraft WHERE crew_id = ?',
    [id]
  );
  
  if (aircraft[0].count > 0) {
    throw new Error('Cannot delete crew that is assigned to aircraft');
  }
  
  // Start transaction to delete crew and its assignments
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Delete crew assignments first
    await connection.query(
      'DELETE FROM crew_assignments WHERE crew_id = ?',
      [id]
    );
    
    // Delete the crew
    const [result] = await connection.query(
      'DELETE FROM crews WHERE crew_id = ?',
      [id]
    );
    
    await connection.commit();
    
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get crew members assigned to a crew
 * @param {number} crewId - Crew ID
 * @returns {Promise<Array>} Crew members assigned to this crew
 */
exports.getCrewMembers = async (crewId) => {
  const [rows] = await pool.query(`
    SELECT 
      cm.crew_member_id,
      cm.first_name,
      cm.last_name,
      cm.role,
      cm.license_number,
      cm.experience_years
    FROM crew_members cm
    JOIN crew_assignments ca ON cm.crew_member_id = ca.crew_member_id
    WHERE ca.crew_id = ?
    ORDER BY cm.role, cm.last_name, cm.first_name
  `, [crewId]);
  
  return rows;
};

/**
 * Assign a crew member to a crew
 * @param {number} crewId - Crew ID
 * @param {number} crewMemberId - Crew member ID
 * @returns {Promise<boolean>} Whether assignment was successful
 */
exports.assignCrewMember = async (crewId, crewMemberId) => {
  try {
    const [result] = await pool.query(`
      INSERT INTO crew_assignments (crew_id, crew_member_id)
      VALUES (?, ?)
    `, [crewId, crewMemberId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    // Unique constraint violation means the assignment already exists
    if (error.code === 'ER_DUP_ENTRY') {
      return false;
    }
    throw error;
  }
};

/**
 * Remove a crew member from a crew
 * @param {number} crewId - Crew ID
 * @param {number} crewMemberId - Crew member ID
 * @returns {Promise<boolean>} Whether removal was successful
 */
exports.removeCrewMember = async (crewId, crewMemberId) => {
  const [result] = await pool.query(`
    DELETE FROM crew_assignments
    WHERE crew_id = ? AND crew_member_id = ?
  `, [crewId, crewMemberId]);
  
  return result.affectedRows > 0;
};

/**
 * Get aircraft assigned to a crew
 * @param {number} crewId - Crew ID
 * @returns {Promise<Array>} Aircraft assigned to this crew
 */
exports.getCrewAircraft = async (crewId) => {
  const [rows] = await pool.query(`
    SELECT 
      a.aircraft_id,
      a.model,
      a.registration_number,
      a.capacity,
      a.status
    FROM aircraft a
    WHERE a.crew_id = ?
  `, [crewId]);
  
  return rows;
};

/**
 * Validate crew composition
 * @param {number} crewId - Crew ID 
 * @returns {Promise<Object>} Validation result with status and message
 */
exports.validateCrewComposition = async (crewId) => {
  // Get all crew members
  const [members] = await pool.query(`
    SELECT cm.role
    FROM crew_members cm
    JOIN crew_assignments ca ON cm.crew_member_id = ca.crew_member_id
    WHERE ca.crew_id = ?
  `, [crewId]);
  
  // Count by role
  const roleCounts = {
    captain: 0,
    pilot: 0,
    flight_attendant: 0
  };
  
  members.forEach(member => {
    if (roleCounts[member.role] !== undefined) {
      roleCounts[member.role]++;
    }
  });
  
  // Validation rules
  const result = {
    valid: true,
    messages: []
  };
  
  if (roleCounts.captain < 1) {
    result.valid = false;
    result.messages.push('Crew must have at least one captain');
  }
  
  if (roleCounts.pilot < 1) {
    result.valid = false;
    result.messages.push('Crew must have at least one pilot');
  }
  
  if (roleCounts.flight_attendant < 2) {
    result.valid = false;
    result.messages.push('Crew must have at least two flight attendants');
  }
  
  return result;
};