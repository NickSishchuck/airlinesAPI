-- Test data for Airline Transportation System
-- Execute this script after creating the database schema
use airline_transportation;
-- Clear existing data (if any)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tickets;
TRUNCATE TABLE passengers;
TRUNCATE TABLE flights;
TRUNCATE TABLE aircraft;
TRUNCATE TABLE captains;
TRUNCATE TABLE routes;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert Routes
INSERT INTO routes (route_id, origin, destination, distance, estimated_duration) VALUES
(1, 'Kyiv', 'Lviv', 470, '01:10:00'),
(2, 'Kyiv', 'Odesa', 440, '01:05:00'),
(3, 'Kyiv', 'Kharkiv', 410, '01:00:00'),
(4, 'Kyiv', 'Warsaw', 690, '01:40:00'),
(5, 'Kyiv', 'Vienna', 1060, '02:10:00'),
(6, 'Lviv', 'Krakow', 210, '00:40:00'),
(7, 'Odesa', 'Istanbul', 670, '01:30:00'),
(8, 'Kharkiv', 'Dnipro', 220, '00:45:00'),
(9, 'Lviv', 'Vienna', 590, '01:20:00'),
(10, 'Odesa', 'Warsaw', 780, '01:45:00');

-- Insert Captains
INSERT INTO captains (captain_id, first_name, last_name, license_number, date_of_birth, experience_years, contact_number, email) VALUES
(1, 'John', 'Smith', 'LIC123456', '1975-05-10', 15, '+380501234567', 'john.smith@airline.com'),
(2, 'Maria', 'Johnson', 'LIC789012', '1980-03-22', 12, '+380502345678', 'maria.johnson@airline.com'),
(3, 'Oleksandr', 'Kovalenko', 'LIC345678', '1978-11-15', 18, '+380503456789', 'oleksandr.kovalenko@airline.com'),
(4, 'Victoria', 'Bondar', 'LIC901234', '1982-07-03', 10, '+380504567890', 'victoria.bondar@airline.com'),
(5, 'Michael', 'Brown', 'LIC567890', '1979-09-28', 14, '+380505678901', 'michael.brown@airline.com');

-- Insert Aircraft
INSERT INTO aircraft (aircraft_id, model, registration_number, capacity, manufacturing_year, captain_id, status) VALUES
(1, 'Boeing 737-800', 'UR-PSA', 189, 2012, 1, 'active'),
(2, 'Airbus A320', 'UR-WDC', 180, 2015, 2, 'active'),
(3, 'Embraer E190', 'UR-ZKP', 104, 2018, 3, 'active'),
(4, 'Boeing 737-700', 'UR-GBD', 149, 2010, 4, 'active'),
(5, 'Airbus A321', 'UR-SQA', 220, 2019, 5, 'active'),
(6, 'Airbus A319', 'UR-CNK', 156, 2014, 1, 'maintenance'),
(7, 'Bombardier CRJ900', 'UR-DNT', 90, 2016, 2, 'active');


-- -- Insert Tickets
-- -- We'll create tickets for different passengers on various flights
-- INSERT INTO tickets (ticket_id, passenger_id, flight_id, seat_number, class, price, booking_date, payment_status) VALUES
-- -- Today's flights
-- (1, 1, 1, '12A', 'economy', 950.00, DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'completed'),
-- (2, 2, 1, '12B', 'economy', 950.00, DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'completed'),
-- (3, 3, 1, '15D', 'economy', 950.00, DATE_ADD(CURRENT_DATE(), INTERVAL -4 DAY), 'completed'),
-- (4, 4, 2, '3F', 'business', 2500.00, DATE_ADD(CURRENT_DATE(), INTERVAL -6 DAY), 'completed'),
-- (5, 5, 2, '4F', 'business', 2500.00, DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY), 'completed'),
-- (6, 6, 3, '8C', 'economy', 850.00, DATE_ADD(CURRENT_DATE(), INTERVAL -2 DAY), 'completed'),
-- (7, 7, 4, '1A', 'business', 3200.00, DATE_ADD(CURRENT_DATE(), INTERVAL -7 DAY), 'completed'),
-- (8, 8, 5, '10E', 'economy', 1250.00, DATE_ADD(CURRENT_DATE(), INTERVAL -4 DAY), 'completed'),
-- (9, 9, 6, '5D', 'economy', 750.00, DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY), 'completed'),
-- (10, 10, 7, '7B', 'economy', 1100.00, DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'completed'),

-- -- Tomorrow's flights
-- (11, 1, 11, '14C', 'economy', 975.00, DATE_ADD(CURRENT_DATE(), INTERVAL -10 DAY), 'completed'),
-- (12, 3, 12, '6A', 'business', 2400.00, DATE_ADD(CURRENT_DATE(), INTERVAL -8 DAY), 'completed'),
-- (13, 5, 13, '9D', 'economy', 900.00, DATE_ADD(CURRENT_DATE(), INTERVAL -7 DAY), 'completed'),
-- (14, 7, 14, '2F', 'business', 3300.00, DATE_ADD(CURRENT_DATE(), INTERVAL -15 DAY), 'completed'),
-- (15, 9, 15, '11B', 'economy', 1300.00, DATE_ADD(CURRENT_DATE(), INTERVAL -9 DAY), 'completed'),

-- -- Day after tomorrow's flights
-- (16, 2, 16, '15A', 'economy', 985.00, DATE_ADD(CURRENT_DATE(), INTERVAL -12 DAY), 'completed'),
-- (17, 4, 17, '4C', 'business', 2550.00, DATE_ADD(CURRENT_DATE(), INTERVAL -14 DAY), 'completed'),
-- (18, 6, 18, '8E', 'economy', 920.00, DATE_ADD(CURRENT_DATE(), INTERVAL -11 DAY), 'completed'),
-- (19, 8, 19, '1D', 'business', 3250.00, DATE_ADD(CURRENT_DATE(), INTERVAL -20 DAY), 'completed'),
-- (20, 10, 20, '12F', 'economy', 1275.00, DATE_ADD(CURRENT_DATE(), INTERVAL -15 DAY), 'completed'),

-- -- Pending payment tickets
-- (21, 1, 3, '9B', 'economy', 850.00, CURRENT_DATE(), 'pending'),
-- (22, 3, 5, '16C', 'economy', 1250.00, CURRENT_DATE(), 'pending'),
-- (23, 5, 7, '10E', 'economy', 1100.00, CURRENT_DATE(), 'pending');

-- Insert Users with plaintext passwords and the three roles
INSERT INTO users (user_id, name, email, password, role, passenger_id) VALUES
(1, 'Admin User', 'admin@airline.com', 'admin123', 'admin', NULL),
(2, 'Worker One', 'worker1@airline.com', 'worker123', 'worker', NULL),
(3, 'Worker Two', 'worker2@airline.com', 'worker123', 'worker', NULL),
(4, 'Anna Kovalenko', 'anna.kovalenko@example.com', 'password123', 'user', 1),
(5, 'Mykhailo Shevchenko', 'mykhailo.shevchenko@example.com', 'password123', 'user', 2),
(6, 'Julia Melnyk', 'julia.melnyk@example.com', 'password123', 'user', 3),
(7, 'Robert Brown', 'robert.brown@example.com', 'password123', 'user', 4),
(8, 'Elena Petrov', 'elena.petrov@example.com', 'password123', 'user', 5);