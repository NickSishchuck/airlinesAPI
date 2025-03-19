-- Test data for Airline Transportation System
-- Execute this script after creating the database schema
USE airline_transportation;

-- Clear existing data (if any)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE tickets;
TRUNCATE TABLE users;
TRUNCATE TABLE flights;
TRUNCATE TABLE aircraft;
TRUNCATE TABLE captains;
TRUNCATE TABLE routes;
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

-- Insert Users (merged with passengers)
INSERT INTO users (user_id, first_name, last_name, email, password, role, passport_number, nationality, date_of_birth, contact_number) VALUES
-- Admin and worker users
(1, 'Admin', 'User', 'admin@airline.com', 'admin123', 'admin', NULL, NULL, NULL, NULL),
(2, 'Worker', 'One', 'worker1@airline.com', 'worker123', 'worker', NULL, NULL, NULL, NULL),
(3, 'Worker', 'Two', 'worker2@airline.com', 'worker123', 'worker', NULL, NULL, NULL, NULL),
-- Passenger users
(4, 'Anna', 'Kovalenko', 'anna.kovalenko@example.com', 'password123', 'passenger', 'FD123456', 'Ukrainian', '1990-05-15', '+380501234567'),
(5, 'Mykhailo', 'Shevchenko', 'mykhailo.shevchenko@example.com', 'password123', 'passenger', 'FD789012', 'Ukrainian', '1985-07-22', '+380502345678'),
(6, 'Julia', 'Melnyk', 'julia.melnyk@example.com', 'password123', 'passenger', 'FD345678', 'Ukrainian', '1992-03-10', '+380503456789'),
(7, 'Robert', 'Brown', 'robert.brown@example.com', 'password123', 'passenger', 'FD901234', 'British', '1988-11-05', '+380504567890'),
(8, 'Elena', 'Petrov', 'elena.petrov@example.com', 'password123', 'passenger', 'FD567890', 'Ukrainian', '1995-09-18', '+380505678901'),
(9, 'Viktor', 'Ponomarenko', 'viktor.ponomarenko@example.com', 'password123', 'passenger', 'FD654321', 'Ukrainian', '1987-12-03', '+380506789012'),
(10, 'Sophie', 'Taylor', 'sophie.taylor@example.com', 'password123', 'passenger', 'FD234567', 'British', '1991-04-27', '+380507890123'),
(11, 'Ivan', 'Bondarenko', 'ivan.bondarenko@example.com', 'password123', 'passenger', 'FD345671', 'Ukrainian', '1989-08-14', '+380508901234'),
(12, 'Emma', 'Wilson', 'emma.wilson@example.com', 'password123', 'passenger', 'FD456782', 'American', '1994-02-19', '+380509012345'),
(13, 'Andrii', 'Savchenko', 'andrii.savchenko@example.com', 'password123', 'passenger', 'FD567893', 'Ukrainian', '1986-06-30', '+380500123456');

-- Insert Flights
INSERT INTO flights 
(flight_id, flight_number, route_id, aircraft_id, departure_time, arrival_time, status, gate) VALUES
(1, 'PS101', 1, 1, null, null, null, 'A1'),
(2, 'PS102', 2, 2, null, null, null, 'B2'),
(3, 'PS103', 3, 3, null, null, null, 'C3'),
(4, 'PS104', 4, 4, null, null, null, 'D4'),
(5, 'PS105', 5, 5, null, null, null, 'E5'),
(6, 'PS106', 6, 6, null, null, null, 'F6'),
(7, 'PS107', 7, 7, null, null, null, 'G7');

-- Insert Tickets
-- We'll create tickets for different passengers on various flights
INSERT INTO tickets (ticket_id, user_id, flight_id, seat_number, class, price, booking_date, payment_status) VALUES
-- Today's flights
(1, 4, 1, '12A', 'economy', 950.00, DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'completed'),
(2, 5, 1, '12B', 'economy', 950.00, DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'completed'),
(3, 6, 1, '15D', 'economy', 950.00, DATE_ADD(CURRENT_DATE(), INTERVAL -4 DAY), 'completed'),
(4, 7, 2, '3F', 'business', 2500.00, DATE_ADD(CURRENT_DATE(), INTERVAL -6 DAY), 'completed'),
(5, 8, 2, '4F', 'business', 2500.00, DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY), 'completed'),
(6, 9, 3, '8C', 'economy', 850.00, DATE_ADD(CURRENT_DATE(), INTERVAL -2 DAY), 'completed'),
(7, 10, 4, '1A', 'business', 3200.00, DATE_ADD(CURRENT_DATE(), INTERVAL -7 DAY), 'completed'),
(8, 11, 5, '10E', 'economy', 1250.00, DATE_ADD(CURRENT_DATE(), INTERVAL -4 DAY), 'completed'),
(9, 12, 6, '5D', 'economy', 750.00, DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY), 'completed'),
(10, 13, 7, '7B', 'economy', 1100.00, DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'completed');
