USE airline_transportation;

-- Query 1: Search for flights by route and date
DELIMITER //
CREATE PROCEDURE search_flights_by_route_and_date(
  IN p_origin VARCHAR(100),
  IN p_destination VARCHAR(100),
  IN p_date DATE
)
BEGIN
  SELECT 
    f.flight_id,
    f.flight_number,
    r.origin,
    r.destination,
    f.departure_time,
    f.arrival_time,
    f.status,
    f.price,
    a.model AS aircraft_model,
    (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id) AS booked_seats,
    a.capacity AS total_seats
  FROM 
    flights f
  JOIN 
    routes r ON f.route_id = r.route_id
  JOIN 
    aircraft a ON f.aircraft_id = a.aircraft_id
  WHERE 
    r.origin = p_origin AND 
    r.destination = p_destination AND 
    DATE(f.departure_time) = p_date AND
    f.status != 'canceled'
  ORDER BY 
    f.departure_time;
END //
DELIMITER ;

-- Query 2: Generate a schedule
DELIMITER //
CREATE PROCEDURE generate_flight_schedule(
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  SELECT 
    f.flight_id,
    f.flight_number,
    r.origin,
    r.destination,
    f.departure_time,
    f.arrival_time,
    f.status,
    a.registration_number AS aircraft,
    CONCAT(c.first_name, ' ', c.last_name) AS captain,
    (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id) AS passengers_count,
    a.capacity AS total_capacity
  FROM 
    flights f
  JOIN 
    routes r ON f.route_id = r.route_id
  JOIN 
    aircraft a ON f.aircraft_id = a.aircraft_id
  JOIN 
    captains c ON a.captain_id = c.captain_id
  WHERE 
    DATE(f.departure_time) BETWEEN p_start_date AND p_end_date
  ORDER BY 
    f.departure_time;
END //
DELIMITER ;

-- Query 3: Generate sold tickets report
DELIMITER //
CREATE PROCEDURE generate_ticket_sales_report(
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  SELECT 
    f.flight_number,
    r.origin,
    r.destination,
    DATE(f.departure_time) AS flight_date,
    COUNT(t.ticket_id) AS tickets_sold,
    SUM(t.price) AS total_revenue,
    a.capacity AS total_capacity,
    (COUNT(t.ticket_id) / a.capacity * 100) AS occupancy_percentage
  FROM 
    tickets t
  JOIN 
    flights f ON t.flight_id = f.flight_id
  JOIN 
    routes r ON f.route_id = r.route_id
  JOIN 
    aircraft a ON f.aircraft_id = a.aircraft_id
  WHERE 
    DATE(t.booking_date) BETWEEN p_start_date AND p_end_date 
    -- AND
    -- t.status != 'canceled'
  GROUP BY 
    f.flight_id
  ORDER BY 
    f.departure_time;
END //
DELIMITER ;

-- Query 4: Generate a ticket (Updated to use users table)
DELIMITER //
CREATE PROCEDURE generate_ticket(
  IN p_ticket_id INT
)
BEGIN
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
    u.passport_number
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
    t.ticket_id = p_ticket_id;
END //
DELIMITER ;

/*
-- Trigger to check if a flight should be canceled (no tickets sold)
DELIMITER //
CREATE TRIGGER before_ticket_cancel
AFTER UPDATE ON tickets
FOR EACH ROW
BEGIN
  DECLARE ticket_count INT;
  
  IF NEW.status = 'canceled' THEN
    -- Check if there are any active tickets for this flight
    SELECT COUNT(*) INTO ticket_count
    FROM tickets
    WHERE flight_id = NEW.flight_id AND status != 'canceled';
    
    -- If no active tickets, cancel the flight
    IF ticket_count = 0 THEN
      UPDATE flights SET status = 'canceled' WHERE flight_id = NEW.flight_id;
    END IF;
  END IF;
END //
DELIMITER ;
 */