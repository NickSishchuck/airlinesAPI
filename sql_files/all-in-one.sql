-- Create the database
CREATE DATABASE IF NOT EXISTS airline_transportation;
USE airline_transportation;

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance FLOAT NOT NULL,
    estimated_duration TIME NOT NULL,
    UNIQUE KEY unique_route (origin, destination)
);

-- Crew Members table
CREATE TABLE IF NOT EXISTS crew_members (
    crew_member_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('captain', 'pilot', 'flight_attendant') NOT NULL,
    license_number VARCHAR(50) UNIQUE,
    date_of_birth DATE NOT NULL,
    experience_years INT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Crews table
CREATE TABLE IF NOT EXISTS crews (
    crew_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status ENUM('active', 'off-duty', 'training') DEFAULT 'active'
);

-- Crew Assignments junction table
CREATE TABLE IF NOT EXISTS crew_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    crew_id INT NOT NULL,
    crew_member_id INT NOT NULL,
    FOREIGN KEY (crew_id) REFERENCES crews(crew_id),
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(crew_member_id),
    UNIQUE KEY unique_crew_member_assignment (crew_id, crew_member_id)
);

-- Aircraft table
CREATE TABLE IF NOT EXISTS aircraft (
    aircraft_id INT AUTO_INCREMENT PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    manufacturing_year YEAR NOT NULL,
    crew_id INT,
    status ENUM('active', 'maintenance', 'retired') DEFAULT 'active',
    FOREIGN KEY (crew_id) REFERENCES crews(crew_id)
);

-- Flights table (with class multipliers)
CREATE TABLE IF NOT EXISTS flights (
    flight_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) UNIQUE,
    route_id INT,
    aircraft_id INT,
    departure_time DATETIME,
    arrival_time DATETIME,
    status ENUM('scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'canceled') DEFAULT 'scheduled',
    gate VARCHAR(10),
    base_price DECIMAL(10, 2),
    first_class_multiplier DECIMAL(4,2) DEFAULT 4.0,
    business_class_multiplier DECIMAL(4,2) DEFAULT 2.5,
    economy_class_multiplier DECIMAL(4,2) DEFAULT 1.0,
    woman_only_multiplier DECIMAL(4,2) DEFAULT 1.2,
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    FOREIGN KEY (aircraft_id) REFERENCES aircraft(aircraft_id)
);

-- Users table with gender
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('admin', 'worker', 'user') DEFAULT 'user',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    passport_number VARCHAR(50) UNIQUE,
    nationality VARCHAR(50),
    date_of_birth DATE,
    contact_number VARCHAR(20),
    gender VARCHAR(10)
);

-- Tickets table with woman_only class
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    flight_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    class ENUM('economy', 'business', 'first', 'woman_only') DEFAULT 'economy',
    price DECIMAL(10, 2),
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status ENUM('pending', 'completed', 'refunded') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    UNIQUE KEY unique_seat (flight_id, seat_number)
);

-- Flight Seats table
CREATE TABLE IF NOT EXISTS flight_seats (
    flight_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    class ENUM('first', 'business', 'economy', 'woman_only') NOT NULL,
    available_seats JSON NOT NULL,
    booked_seats JSON NOT NULL,
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    UNIQUE KEY unique_flight_class (flight_id, class)
);

-- Create indexes for better query performance
CREATE INDEX idx_flights_departure ON flights(departure_time);
CREATE INDEX idx_flights_route ON flights(route_id);
CREATE INDEX idx_tickets_flight ON tickets(flight_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_crew_assignments_crew ON crew_assignments(crew_id);
CREATE INDEX idx_crew_assignments_member ON crew_assignments(crew_member_id);

-- Clear existing data (if any)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE flight_seats;
TRUNCATE TABLE tickets;
TRUNCATE TABLE users;
TRUNCATE TABLE flights;
TRUNCATE TABLE aircraft;
TRUNCATE TABLE crew_assignments;
TRUNCATE TABLE crews;
TRUNCATE TABLE crew_members;
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

-- Insert Crew Members
INSERT INTO crew_members (crew_member_id, first_name, last_name, role, license_number, date_of_birth, experience_years, contact_number, email) VALUES
(1, 'John', 'Smith', 'captain', 'CAP123456', '1975-05-10', 15, '+380501234567', 'john.smith@airline.com'),
(2, 'Maria', 'Johnson', 'captain', 'CAP789012', '1980-03-22', 12, '+380502345678', 'maria.johnson@airline.com'),
(3, 'Oleksandr', 'Kovalenko', 'pilot', 'PIL345678', '1978-11-15', 18, '+380503456789', 'oleksandr.kovalenko@airline.com'),
(4, 'Victoria', 'Bondar', 'pilot', 'PIL901234', '1982-07-03', 10, '+380504567890', 'victoria.bondar@airline.com'),
(5, 'Michael', 'Brown', 'flight_attendant', NULL, '1979-09-28', 14, '+380505678901', 'michael.brown@airline.com'),
(6, 'Sophia', 'Wilson', 'flight_attendant', NULL, '1985-04-19', 8, '+380506789012', 'sophia.wilson@airline.com'),
(7, 'Daniel', 'Taylor', 'flight_attendant', NULL, '1988-12-05', 6, '+380507890123', 'daniel.taylor@airline.com'),
(8, 'Olena', 'Shevchenko', 'flight_attendant', NULL, '1990-08-14', 5, '+380508901234', 'olena.shevchenko@airline.com');

-- Insert Crews
INSERT INTO crews (crew_id, name, status) VALUES
(1, 'Alpha Crew', 'active'),
(2, 'Beta Crew', 'active'),
(3, 'Gamma Crew', 'active'),
(4, 'Delta Crew', 'off-duty');

-- Insert Crew Assignments
INSERT INTO crew_assignments (crew_id, crew_member_id) VALUES
(1, 1), (1, 3), (1, 5), (1, 6),  -- Alpha Crew
(2, 2), (2, 4), (2, 7), (2, 8),  -- Beta Crew
(3, 1), (3, 4), (3, 5), (3, 8);  -- Gamma Crew

-- Insert Aircraft
INSERT INTO aircraft (aircraft_id, model, registration_number, capacity, manufacturing_year, crew_id, status) VALUES
(1, 'Boeing 737-800', 'UR-PSA', 189, 2012, 1, 'active'),
(2, 'Airbus A320', 'UR-WDC', 180, 2015, 2, 'active'),
(3, 'Embraer E190', 'UR-ZKP', 104, 2018, 3, 'active'),
(4, 'Boeing 737-700', 'UR-GBD', 149, 2010, 1, 'active'),
(5, 'Airbus A321', 'UR-SQA', 220, 2019, 2, 'active'),
(6, 'Airbus A319', 'UR-CNK', 156, 2014, NULL, 'maintenance'),
(7, 'Bombardier CRJ900', 'UR-DNT', 90, 2016, 3, 'active');

-- Insert Users (merged with passengers) with gender
INSERT INTO users (user_id, first_name, last_name, email, password, role, passport_number, nationality, date_of_birth, contact_number, gender) VALUES
-- Admin and worker users
(1, 'Admin', 'User', 'admin@airline.com', 'admin123', 'admin', NULL, NULL, NULL, NULL, 'male'),
(2, 'Worker', 'One', 'worker1@airline.com', 'worker123', 'worker', NULL, NULL, NULL, NULL, 'female'),
(3, 'Worker', 'Two', 'worker2@airline.com', 'worker123', 'worker', NULL, NULL, NULL, NULL, 'male'),
-- Passenger users
(4, 'Anna', 'Kovalenko', 'anna.kovalenko@example.com', 'password123', 'user', 'FD123456', 'Ukrainian', '1990-05-15', '+380501234567', 'female'),
(5, 'Mykhailo', 'Shevchenko', 'mykhailo.shevchenko@example.com', 'password123', 'user', 'FD789012', 'Ukrainian', '1985-07-22', '+380502345678', 'male'),
(6, 'Julia', 'Melnyk', 'julia.melnyk@example.com', 'password123', 'user', 'FD345678', 'Ukrainian', '1992-03-10', '+380503456789', 'female'),
(7, 'Robert', 'Brown', 'robert.brown@example.com', 'password123', 'user', 'FD901234', 'British', '1988-11-05', '+380504567890', 'male'),
(8, 'Elena', 'Petrov', 'elena.petrov@example.com', 'password123', 'user', 'FD567890', 'Ukrainian', '1995-09-18', '+380505678901', 'female'),
(9, 'Viktor', 'Ponomarenko', 'viktor.ponomarenko@example.com', 'password123', 'user', 'FD654321', 'Ukrainian', '1987-12-03', '+380506789012', 'male'),
(10, 'Sophie', 'Taylor', 'sophie.taylor@example.com', 'password123', 'user', 'FD234567', 'British', '1991-04-27', '+380507890123', 'female'),
(11, 'Ivan', 'Bondarenko', 'ivan.bondarenko@example.com', 'password123', 'user', 'FD345671', 'Ukrainian', '1989-08-14', '+380508901234', 'male'),
(12, 'Emma', 'Wilson', 'emma.wilson@example.com', 'password123', 'user', 'FD456782', 'American', '1994-02-19', '+380509012345', 'female'),
(13, 'Andrii', 'Savchenko', 'andrii.savchenko@example.com', 'password123', 'user', 'FD567893', 'Ukrainian', '1986-06-30', '+380500123456', 'male');

-- Insert Flights with base prices and class multipliers
INSERT INTO flights 
(flight_id, flight_number, route_id, aircraft_id, departure_time, arrival_time, status, gate, base_price, first_class_multiplier, business_class_multiplier, economy_class_multiplier, woman_only_multiplier) VALUES
(1, 'PS101', 1, 1, '2025-04-20 08:00:00', '2025-04-20 09:10:00', 'scheduled', 'A1', 200.00, 4.0, 2.5, 1.0, 1.2),
(2, 'PS102', 2, 2, '2025-04-21 10:30:00', '2025-04-21 11:35:00', 'scheduled', 'B2', 180.00, 4.2, 2.7, 1.0, 1.2),
(3, 'PS103', 3, 3, '2025-04-22 14:15:00', '2025-04-22 15:15:00', 'scheduled', 'C3', 160.00, 4.0, 2.5, 1.0, 1.2),
(4, 'PS104', 4, 4, '2025-04-23 06:45:00', '2025-04-23 08:25:00', 'scheduled', 'D4', 300.00, 3.8, 2.4, 1.0, 1.1),
(5, 'PS105', 5, 5, '2025-04-24 12:00:00', '2025-04-24 14:10:00', 'scheduled', 'E5', 350.00, 4.0, 2.6, 1.0, 1.2),
(6, 'PS106', 6, 3, '2025-04-25 16:30:00', '2025-04-25 17:10:00', 'scheduled', 'F6', 150.00, 4.0, 2.5, 1.0, 1.2),
(7, 'PS107', 7, 7, '2025-04-26 09:20:00', '2025-04-26 10:50:00', 'scheduled', 'G7', 220.00, 4.0, 2.5, 1.0, 1.2);

-- Initialize flight seats for each flight
-- Flight 1 (Boeing 737-800)
INSERT INTO flight_seats (flight_id, class, available_seats, booked_seats) VALUES
(1, 'first', '["1A","1B","1C","1D","1E","1F","2A","2B","2C","2D","2E","2F"]', '[]'),
(1, 'business', '["3A","3B","3C","3D","3E","3F","4A","4B","4C","4D","4E","4F","5A","5B","5C","5D","5E","5F","6A","6B","6C","6D","6E","6F","7A","7B","7C","7D","7E","7F"]', '[]'),
(1, 'woman_only', '["8A","8B","8C","8D","8E","8F","9A","9B","9C","9D","9E","9F","10A","10B","10C","10D","10E","10F"]', '[]'),
(1, 'economy', '["11A","11B","11C","11D","11E","11F","12A","12B","12C","12D","12E","12F","13A","13B","13C","13D","13E","13F","14A","14B","14C","14D","14E","14F","15A","15B","15C","15D","15E","15F","16A","16B","16C","16D","16E","16F","17A","17B","17C","17D","17E","17F","18A","18B","18C","18D","18E","18F","19A","19B","19C","19D","19E","19F","20A","20B","20C","20D","20E","20F","21A","21B","21C","21D","21E","21F","22A","22B","22C","22D","22E","22F","23A","23B","23C","23D","23E","23F","24A","24B","24C","24D","24E","24F","25A","25B","25C","25D","25E","25F","26A","26B","26C","26D","26E","26F","27A","27B","27C","27D","27E","27F","28A","28B","28C","28D","28E","28F","29A","29B","29C","29D","29E","29F","30A","30B","30C","30D","30E","30F"]', '[]');

-- Flight 2 (Airbus A320)
INSERT INTO flight_seats (flight_id, class, available_seats, booked_seats) VALUES
(2, 'first', '["1A","1B","1C","1D","1E","1F","2A","2B","2C","2D","2E","2F"]', '[]'),
(2, 'business', '["3A","3B","3C","3D","3E","3F","4A","4B","4C","4D","4E","4F","5A","5B","5C","5D","5E","5F","6A","6B","6C","6D","6E","6F","7A","7B","7C","7D","7E","7F"]', '[]'),
(2, 'woman_only', '["8A","8B","8C","8D","8E","8F","9A","9B","9C","9D","9E","9F","10A","10B","10C","10D","10E","10F"]', '[]'),
(2, 'economy', '["11A","11B","11C","11D","11E","11F","12A","12B","12C","12D","12E","12F","13A","13B","13C","13D","13E","13F","14A","14B","14C","14D","14E","14F","15A","15B","15C","15D","15E","15F","16A","16B","16C","16D","16E","16F","17A","17B","17C","17D","17E","17F","18A","18B","18C","18D","18E","18F","19A","19B","19C","19D","19E","19F","20A","20B","20C","20D","20E","20F","21A","21B","21C","21D","21E","21F","22A","22B","22C","22D","22E","22F","23A","23B","23C","23D","23E","23F","24A","24B","24C","24D","24E","24F","25A","25B","25C","25D","25E","25F","26A","26B","26C","26D","26E","26F","27A","27B","27C","27D","27E","27F","28A","28B","28C","28D","28E","28F"]', '[]');

-- Flight 3 (Embraer E190)
INSERT INTO flight_seats (flight_id, class, available_seats, booked_seats) VALUES
(3, 'first', '["1A","1B","1C","1D"]', '[]'),
(3, 'business', '["2A","2B","2C","2D","3A","3B","3C","3D","4A","4B","4C","4D"]', '[]'),
(3, 'woman_only', '["5A","5B","5C","5D","6A","6B","6C","6D"]', '[]'),
(3, 'economy', '["7A","7B","7C","7D","8A","8B","8C","8D","9A","9B","9C","9D","10A","10B","10C","10D","11A","11B","11C","11D","12A","12B","12C","12D","13A","13B","13C","13D","14A","14B","14C","14D","15A","15B","15C","15D","16A","16B","16C","16D","17A","17B","17C","17D","18A","18B","18C","18D","19A","19B","19C","19D","20A","20B","20C","20D","21A","21B","21C","21D","22A","22B","22C","22D","23A","23B","23C","23D","24A","24B","24C","24D","25A","25B","25C","25D","26A","26B","26C","26D"]', '[]');

-- Only initialize first 3 flights for simplicity

-- Insert Tickets with class information
-- We'll create tickets for different passengers on various flights
INSERT INTO tickets (ticket_id, user_id, flight_id, seat_number, class, price, booking_date, payment_status) VALUES
-- Flight 1 tickets
(1, 4, 1, '14C', 'economy', 200.00, DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'completed'),
(2, 5, 1, '15B', 'economy', 200.00, DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'completed'),
(3, 6, 1, '1E', 'first', 800.00, DATE_ADD(CURRENT_DATE(), INTERVAL -4 DAY), 'completed'),
(4, 8, 1, '9D', 'woman_only', 240.00, DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY), 'completed'),

-- Flight 2 tickets
(5, 7, 2, '3F', 'business', 486.00, DATE_ADD(CURRENT_DATE(), INTERVAL -6 DAY), 'completed'),
(6, 10, 2, '8A', 'woman_only', 216.00, DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY), 'completed'),
(7, 9, 2, '12C', 'economy', 180.00, DATE_ADD(CURRENT_DATE(), INTERVAL -2 DAY), 'completed'),

-- Flight 3 tickets
(8, 11, 3, '8D', 'economy', 160.00, DATE_ADD(CURRENT_DATE(), INTERVAL -4 DAY), 'completed'),
(9, 12, 3, '5B', 'woman_only', 192.00, DATE_ADD(CURRENT_DATE(), INTERVAL -3 DAY), 'completed'),
(10, 13, 3, '2C', 'business', 400.00, DATE_ADD(CURRENT_DATE(), INTERVAL -5 DAY), 'completed');

-- Update flight_seats booked arrays to match the tickets
-- Flight 1
UPDATE flight_seats SET 
booked_seats = '["14C","15B"]' 
WHERE flight_id = 1 AND class = 'economy';

UPDATE flight_seats SET 
booked_seats = '["1E"]' 
WHERE flight_id = 1 AND class = 'first';

UPDATE flight_seats SET 
booked_seats = '["9D"]' 
WHERE flight_id = 1 AND class = 'woman_only';

-- Update available seats to remove booked ones
UPDATE flight_seats SET 
available_seats = JSON_REMOVE(
  JSON_REMOVE(
    available_seats, 
    JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '14C'))
  ),
  JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '15B'))
)
WHERE flight_id = 1 AND class = 'economy';

UPDATE flight_seats SET 
available_seats = JSON_REMOVE(
  available_seats, 
  JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '1E'))
)
WHERE flight_id = 1 AND class = 'first';

UPDATE flight_seats SET 
available_seats = JSON_REMOVE(
  available_seats, 
  JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '9D'))
)
WHERE flight_id = 1 AND class = 'woman_only';

-- Flight 2
UPDATE flight_seats SET 
booked_seats = '["3F"]' 
WHERE flight_id = 2 AND class = 'business';

UPDATE flight_seats SET 
booked_seats = '["8A"]' 
WHERE flight_id = 2 AND class = 'woman_only';

UPDATE flight_seats SET 
booked_seats = '["12C"]' 
WHERE flight_id = 2 AND class = 'economy';

-- Update available seats to remove booked ones
UPDATE flight_seats SET 
available_seats = JSON_REMOVE(
  available_seats, 
  JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '3F'))
)
WHERE flight_id = 2 AND class = 'business';

UPDATE flight_seats SET 
available_seats = JSON_REMOVE(
  available_seats, 
  JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '8A'))
)
WHERE flight_id = 2 AND class = 'woman_only';

UPDATE flight_seats SET 
available_seats = JSON_REMOVE(
  available_seats, 
  JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '12C'))
)
WHERE flight_id = 2 AND class = 'economy';

-- Flight 3
UPDATE flight_seats SET 
booked_seats = '["8D"]' 
WHERE flight_id = 3 AND class = 'economy';

UPDATE flight_seats SET 
booked_seats = '["5B"]' 
WHERE flight_id = 3 AND class = 'woman_only';

UPDATE flight_seats SET 
booked_seats = '["2C"]' 
WHERE flight_id = 3 AND class = 'business';

-- Update available seats to remove booked ones
UPDATE flight_seats SET 
available_seats = JSON_REMOVE(
  available_seats, 
  JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '8D'))
)
WHERE flight_id = 3 AND class = 'economy';

UPDATE flight_seats SET 
available_seats = JSON_REMOVE(
  available_seats, 
  JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '5B'))
)
WHERE flight_id = 3 AND class = 'woman_only';

UPDATE flight_seats SET 
available_seats = JSON_REMOVE(
  available_seats, 
  JSON_UNQUOTE(JSON_SEARCH(available_seats, 'one', '2C'))
)
WHERE flight_id = 3 AND class = 'business';
