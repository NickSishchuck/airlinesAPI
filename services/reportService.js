const { pool } = require('../config/database');
const { formatDate } = require('../utils/dateFormat');

/**
 * Generate detailed revenue report
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Revenue report
 */
exports.generateRevenueReport = async (startDate, endDate) => {
  const [routeRevenue] = await pool.query(`
    SELECT 
      r.route_id,
      r.origin,
      r.destination,
      COUNT(t.ticket_id) AS tickets_sold,
      SUM(t.price) AS total_revenue,
      AVG(t.price) AS average_ticket_price
    FROM tickets t
    JOIN flights f ON t.flight_id = f.flight_id
    JOIN routes r ON f.route_id = r.route_id
    WHERE t.booking_date BETWEEN ? AND ?
    AND t.payment_status = 'completed'
    GROUP BY r.route_id
    ORDER BY total_revenue DESC
  `, [startDate, endDate]);

  const [classRevenue] = await pool.query(`
    SELECT 
      t.class,
      COUNT(t.ticket_id) AS tickets_sold,
      SUM(t.price) AS total_revenue,
      AVG(t.price) AS average_ticket_price
    FROM tickets t
    WHERE t.booking_date BETWEEN ? AND ?
    AND t.payment_status = 'completed'
    GROUP BY t.class
    ORDER BY total_revenue DESC
  `, [startDate, endDate]);

  // Revenue by day
  const [dailyRevenue] = await pool.query(`
    SELECT 
      DATE(t.booking_date) AS booking_day,
      COUNT(t.ticket_id) AS tickets_sold,
      SUM(t.price) AS total_revenue
    FROM tickets t
    WHERE t.booking_date BETWEEN ? AND ?
    AND t.payment_status = 'completed'
    GROUP BY booking_day
    ORDER BY booking_day
  `, [startDate, endDate]);

  // Overall totals
  const [totals] = await pool.query(`
    SELECT 
      COUNT(t.ticket_id) AS total_tickets_sold,
      SUM(t.price) AS total_revenue,
      AVG(t.price) AS average_ticket_price
    FROM tickets t
    WHERE t.booking_date BETWEEN ? AND ?
    AND t.payment_status = 'completed'
  `, [startDate, endDate]);

  return {
    startDate,
    endDate,
    routeRevenue,
    classRevenue,
    dailyRevenue,
    totals: totals[0]
  };
};

/**
 * Generate flight occupancy report
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Occupancy report
 */
exports.generateOccupancyReport = async (startDate, endDate) => {
  const [rows] = await pool.query(`
    SELECT 
      f.flight_id,
      f.flight_number,
      r.origin,
      r.destination,
      DATE(f.departure_time) AS flight_date,
      COUNT(t.ticket_id) AS tickets_sold,
      a.capacity AS total_capacity,
      ROUND((COUNT(t.ticket_id) / a.capacity) * 100, 2) AS occupancy_percentage
    FROM flights f
    JOIN routes r ON f.route_id = r.route_id
    JOIN aircraft a ON f.aircraft_id = a.aircraft_id
    LEFT JOIN tickets t ON f.flight_id = t.flight_id
    WHERE DATE(f.departure_time) BETWEEN ? AND ?
    GROUP BY f.flight_id
    ORDER BY flight_date, f.flight_number
  `, [startDate, endDate]);

  return rows;
};

/**
 * Generate route popularity report
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Route popularity
 */
exports.generateRoutePopularityReport = async (startDate, endDate) => {
  const [rows] = await pool.query(`
    SELECT 
      r.route_id,
      r.origin,
      r.destination,
      COUNT(DISTINCT f.flight_id) AS flights_count,
      COUNT(t.ticket_id) AS tickets_sold,
      SUM(t.price) AS total_revenue
    FROM routes r
    LEFT JOIN flights f ON r.route_id = f.route_id AND DATE(f.departure_time) BETWEEN ? AND ?
    LEFT JOIN tickets t ON f.flight_id = t.flight_id
    GROUP BY r.route_id
    ORDER BY tickets_sold DESC
  `, [startDate, endDate]);

  return rows;
};
