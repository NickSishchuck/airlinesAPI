-- Migration 1: Add gender to users table
ALTER TABLE users 
ADD COLUMN gender VARCHAR(10) DEFAULT NULL;

-- Migration 2: Create flight_seats table
CREATE TABLE flight_seats (
    flight_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    class ENUM('first', 'business', 'economy', 'woman_only') NOT NULL,
    available_seats JSON NOT NULL, -- ["1A", "1B", "1C", ...]
    booked_seats JSON NOT NULL, -- ["2A", "3C", ...]
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    UNIQUE KEY unique_flight_class (flight_id, class)
);

-- Migration 3: Add class multipliers to flights table
ALTER TABLE flights 
ADD COLUMN first_class_multiplier DECIMAL(4,2) DEFAULT 4.0,
ADD COLUMN business_class_multiplier DECIMAL(4,2) DEFAULT 2.5,
ADD COLUMN economy_class_multiplier DECIMAL(4,2) DEFAULT 1.0,
ADD COLUMN woman_only_multiplier DECIMAL(4,2) DEFAULT 1.2;

-- Migration 4: Update tickets table to include woman_only class
ALTER TABLE tickets 
MODIFY COLUMN class ENUM('economy', 'business', 'first', 'woman_only') DEFAULT 'economy';
