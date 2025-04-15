# Airline Transportation API: Seat Management System

## Overview

This document outlines the implementation of a comprehensive seat management system for the Airline Transportation API. The system allows for efficient seat allocation, booking validation, and class-specific pricing. It includes support for multiple seating classes, including a dedicated "woman only" section.

## 1. Database Changes

### 1.1 User Table Enhancements

```sql
-- Add gender field to users table
ALTER TABLE users 
ADD COLUMN gender VARCHAR(10) DEFAULT NULL;
```

### 1.2 Flight Seats Table (New)

```sql
-- Create flight_seats table to manage seat availability
CREATE TABLE flight_seats (
    flight_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    class ENUM('first', 'business', 'economy', 'woman_only') NOT NULL,
    available_seats JSON NOT NULL, -- ["1A", "1B", "1C", ...]
    booked_seats JSON NOT NULL, -- ["2A", "3C", ...]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    UNIQUE KEY unique_flight_class (flight_id, class)
);
```

### 1.3 Flight Table Enhancements

```sql
-- Add class multipliers to flights table
ALTER TABLE flights 
ADD COLUMN first_class_multiplier DECIMAL(4,2) DEFAULT 4.0,
ADD COLUMN business_class_multiplier DECIMAL(4,2) DEFAULT 2.5,
ADD COLUMN economy_class_multiplier DECIMAL(4,2) DEFAULT 1.0,
ADD COLUMN woman_only_multiplier DECIMAL(4,2) DEFAULT 1.2;
```

### 1.4 Tickets Table Enhancements

```sql
-- Update tickets table to include woman_only class
ALTER TABLE tickets 
MODIFY COLUMN class ENUM('economy', 'business', 'first', 'woman_only') DEFAULT 'economy';
```

## 2. New Models

### 2.1 Flight Seats Model (`flightSeatsModel.js`)

The model handles all seat-related operations:

- **Seat Initialization**: Generates seat layouts based on aircraft type and capacity
- **Seat Availability**: Manages which seats are available or booked
- **Seat Booking**: Handles the atomic process of booking a seat
- **Seat Release**: Returns a booked seat to available status
- **Class Validation**: Ensures class-specific rules are enforced (e.g., gender validation for woman-only seats)

Key functions:
- `initializeFlightSeats(flightId, aircraftId)`
- `getAvailableSeatsByClass(flightId, seatClass)`
- `getBookedSeatsByClass(flightId, seatClass)`
- `getFlightSeatMap(flightId)`
- `isSeatAvailable(flightId, seatClass, seatNumber)`
- `bookSeat(flightId, seatClass, seatNumber)`
- `releaseSeat(flightId, seatClass, seatNumber)`
- `validateWomanOnlySeat(gender)`
- `getAllAvailableSeats(flightId)`
- `reconfigureFlightSeats(flightId, configuration)`

### 2.2 Helper Functions

- `calculateSeatDistribution(aircraftModel, totalCapacity)`: Determines how many seats to allocate to each class
- `generateSeatLayouts(seatDistribution, aircraftModel)`: Creates the actual seat maps (e.g., 1A, 1B, etc.)
- `generateSeatsForClass(startRow, endRow, seatLetters, maxSeats)`: Generates seat codes for a specific class
- `generateCustomSeatLayouts(configuration, aircraftModel, totalCapacity)`: Allows for custom seat configurations

## 3. Updated Models

### 3.1 Ticket Model (`ticketModel.js`) Updates

Enhanced to work with the new seat management system:

- Updated `createTicket()` to validate seat availability and handle class-specific pricing
- Enhanced `updateTicket()` to properly release old seats and book new ones
- Modified `deleteTicket()` to return seats to the available pool
- Added `validateSeatForBooking()` to check all seat booking prerequisites
- Enhanced `getAvailableSeatsByClass()` to work with the new flight_seats table
- Enhanced `generateTicketSalesReport()` to include seat availability statistics

## 4. New Controller

### 4.1 Flight Seats Controller (`flightSeatsController.js`)

Exposes the seat management functionality via API endpoints:

- `initializeFlightSeats`: Creates the initial seat layout for a flight
- `getFlightSeatMap`: Returns all seat information for a flight
- `getAvailableSeatsByClass`: Returns available seats for a specific class
- `checkSeatAvailability`: Checks if a specific seat is available
- `validateSeat`: Validates a seat for a specific user (including gender restrictions)
- `reconfigureFlightSeats`: Allows admins to modify seat configurations

## 5. Updated Controller

### 5.1 Ticket Controller (`ticketController.js`) Updates

- Enhanced `bookTicket()` to work with the new seat validation system
- Updated `updateTicket()` to handle seat changes properly
- Modified `deleteTicket()` to release seats back to the available pool
- Added `validateSeat()` endpoint for pre-booking validation
- Added `holdSeat()` and `releaseSeat()` for temporary seat reservations
- Enhanced `getAvailableSeats()` to work with the new seat management system
- Enhanced `generateTicketSalesReport()` to include detailed seat availability info

## 6. New Routes

### 6.1 Flight Seats Routes (`routes/flightSeats.js`)

```javascript
// Public routes
router.route('/:flightId/seat-map').get(getFlightSeatMap);
router.route('/:flightId/available/:class').get(getAvailableSeatsByClass);
router.route('/:flightId/check/:class/:seatNumber').get(checkSeatAvailability);

// Protected routes
router.route('/:flightId/validate').post(protect, validateSeat);

// Admin routes
router.route('/:flightId/initialize').post(protect, authorize('admin', 'worker'), initializeFlightSeats);
router.route('/:flightId/reconfigure').put(protect, authorize('admin'), reconfigureFlightSeats);
```

## 7. Updated Routes

### 7.1 Ticket Routes (`routes/tickets.js`) Updates

Added new endpoints for seat validation and management:

```javascript
// Seat validation and management routes
router.route('/validate-seat').post(protect, validateSeat);
router.route('/hold-seat').post(protect, holdSeat);
router.route('/release-seat').post(protect, releaseSeat);

// Enhanced available seats endpoint
router.route('/flight/:flightId/available-seats').get(getAvailableSeats);
router.route('/flight/:flightId/available-seats/:class').get(getAvailableSeats);
```

## 8. API Endpoints Documentation

### 8.1 Flight Seats Endpoints

#### 8.1.1 Initialize Flight Seats
```
POST /api/flight-seats/:flightId/initialize
```
Creates the initial seat layout for a flight based on aircraft type.

**Authorization Required**: Admin, Worker  
**Response**: Complete seat map with available seats by class

#### 8.1.2 Get Seat Map
```
GET /api/flight-seats/:flightId/seat-map
```
Returns the complete seat map with availability status.

**Authorization Required**: None  
**Response**: All seats organized by class, with available and booked status

#### 8.1.3 Get Available Seats By Class
```
GET /api/flight-seats/:flightId/available/:class
```
Returns all available seats for a specific class.

**Authorization Required**: None  
**Parameters**: class (economy, business, first, woman_only)  
**Response**: List of available seats for the specified class

#### 8.1.4 Check Seat Availability
```
GET /api/flight-seats/:flightId/check/:class/:seatNumber
```
Checks if a specific seat is available.

**Authorization Required**: None  
**Parameters**: class, seatNumber  
**Response**: Boolean indicating availability

#### 8.1.5 Validate Seat
```
POST /api/flight-seats/:flightId/validate
```
Validates if a seat can be booked by the current user (includes gender validation).

**Authorization Required**: User  
**Request Body**: `{ "seatClass": "woman_only", "seatNumber": "10A" }`  
**Response**: Validation result with details

#### 8.1.6 Reconfigure Seats
```
PUT /api/flight-seats/:flightId/reconfigure
```
Allows admins to change the seat configuration.

**Authorization Required**: Admin  
**Request Body**: `{ "configuration": { "first": 10, "business": 30, "economy": 100, "woman_only": 20 } }`  
**Response**: Updated seat map

### 8.2 Enhanced Ticket Endpoints

#### 8.2.1 Validate Seat For Booking
```
POST /api/tickets/validate-seat
```
Validates a seat before booking.

**Authorization Required**: User  
**Request Body**: `{ "flight_id": 1, "seat_number": "12A", "class": "economy" }`  
**Response**: Validation result with price information

#### 8.2.2 Hold Seat Temporarily
```
POST /api/tickets/hold-seat
```
Holds a seat temporarily during the booking process.

**Authorization Required**: User  
**Request Body**: `{ "flight_id": 1, "seat_number": "12A", "class": "economy" }`  
**Response**: Hold confirmation with expiry time

#### 8.2.3 Release Held Seat
```
POST /api/tickets/release-seat
```
Releases a previously held seat.

**Authorization Required**: User  
**Request Body**: `{ "flight_id": 1, "seat_number": "12A", "class": "economy" }`  
**Response**: Release confirmation

#### 8.2.4 Get Available Seats
```
GET /api/tickets/flight/:flightId/available-seats/:class?
```
Returns all available seats, optionally filtered by class.

**Authorization Required**: None  
**Parameters**: class (optional)  
**Response**: Available seats with price information

## 9. Implementation Details

### 9.1 Seat Class Distribution

The system automatically distributes seats among different classes based on aircraft type:

- **First Class**: 5-10% of total capacity
- **Business Class**: 15-25% of total capacity
- **Economy Class**: 60-75% of total capacity
- **Woman Only**: 5-10% of total capacity

These distributions can be customized during initialization or later through the reconfigure endpoint.

### 9.2 Pricing Model

Each class has a multiplier applied to the flight's base price:

- **First Class**: 4.0x base price (default)
- **Business Class**: 2.5x base price (default)
- **Economy Class**: 1.0x base price (default)
- **Woman Only**: 1.2x base price (default)

These multipliers can be modified on a per-flight basis.

### 9.3 Gender Validation

For the "woman_only" class, the system validates the user's gender before allowing a booking:

```javascript
exports.validateWomanOnlySeat = (gender) => {
  return gender && gender.toLowerCase() === 'female';
};
```

### 9.4 Transaction Safety

All seat operations (booking, updating, releasing) use database transactions to ensure atomic operations and prevent double-booking scenarios.

## 10. Usage Examples

### 10.1 Initializing Flight Seats

```http
POST /api/flight-seats/1/initialize
```

Response:
```json
{
  "success": true,
  "message": "Flight seats initialized successfully",
  "data": {
    "flight_id": "1",
    "seat_map": {
      "first": {
        "available": ["1A", "1B", "1C", "1D", "2A", "2B", "2C", "2D"],
        "booked": []
      },
      "business": {
        "available": ["3A", "3B", "3C", "3D", "3E", "3F", "4A", "4B", "4C", "4D", "4E", "4F"],
        "booked": []
      },
      "woman_only": {
        "available": ["5A", "5B", "5C", "5D", "5E", "5F", "6A", "6B", "6C", "6D", "6E", "6F"],
        "booked": []
      },
      "economy": {
        "available": ["7A", "7B", "7C", "7D", "7E", "7F", "8A", "8B", "8C", "8D", "8E", "8F"],
        "booked": []
      }
    }
  }
}
```

### 10.2 Booking a Ticket

```http
POST /api/tickets
Content-Type: application/json

{
  "flight_id": 1,
  "seat_number": "7A",
  "class": "economy"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "ticket_id": 123,
    "user_id": 456,
    "flight_id": 1,
    "seat_number": "7A",
    "class": "economy",
    "price": 250.00,
    "booking_date": "2025-04-15T10:30:00.000Z",
    "payment_status": "pending",
    "flight_number": "PS101",
    "departure_time": "2025-04-20T08:00:00.000Z",
    "arrival_time": "2025-04-20T10:30:00.000Z"
  }
}
```

### 10.3 Checking Seat Availability

```http
GET /api/flight-seats/1/check/business/3A
```

Response:
```json
{
  "success": true,
  "data": {
    "flight_id": "1",
    "flight_number": "PS101",
    "class": "business",
    "seat_number": "3A",
    "is_available": true
  }
}
```

### 10.4 Viewing the Seat Map

```http
GET /api/flight-seats/1/seat-map
```

Response:
```json
{
  "success": true,
  "data": {
    "flight_id": "1",
    "flight_number": "PS101",
    "seat_map": {
      "first": {
        "available": ["1A", "1B", "1C", "1D", "2A", "2B", "2C", "2D"],
        "booked": []
      },
      "business": {
        "available": ["3B", "3C", "3D", "3E", "3F", "4A", "4B", "4C", "4D", "4E", "4F"],
        "booked": ["3A"]
      },
      "woman_only": {
        "available": ["5A", "5B", "5C", "5D", "5E", "5F", "6A", "6B", "6C", "6D", "6E", "6F"],
        "booked": []
      },
      "economy": {
        "available": ["7B", "7C", "7D", "7E", "7F", "8A", "8B", "8C", "8D", "8E", "8F"],
        "booked": ["7A"]
      }
    },
    "stats": {
      "by_class": {
        "first": {
          "available": 8,
          "booked": 0,
          "total": 8,
          "occupancy_percentage": 0
        },
        "business": {
          "available": 11,
          "booked": 1,
          "total": 12,
          "occupancy_percentage": 8
        },
        "woman_only": {
          "available": 12,
          "booked": 0,
          "total": 12,
          "occupancy_percentage": 0
        },
        "economy": {
          "available": 11,
          "booked": 1,
          "total": 12,
          "occupancy_percentage": 8
        }
      },
      "total": {
        "available": 42,
        "booked": 2,
        "total": 44,
        "occupancy_percentage": 5
      }
    },
    "prices": {
      "economy": 250.00,
      "business": 625.00,
      "first": 1000.00,
      "woman_only": 300.00
    }
  }
}
```

## 11. Integration with Existing System

To integrate this seat management system into the application:

1. Run the database migration SQL scripts
2. Add the new model files to the models directory
3. Add the new controller files to the controllers directory 
4. Add the new route file to the routes directory
5. Update the existing files as described
6. Update app.js to include the new flight-seats routes
7. For existing flights, run the seat initialization procedure
8. Update any client-side code to use the new endpoints

## 12. Future Enhancements

Potential improvements for future iterations:

1. **Seat Preferences**: Add support for window/aisle preferences
2. **Group Booking**: Enhance the system to handle group bookings (adjacent seats)
3. **Temporary Holds**: Implement a Redis-based system for temporary seat holds during booking
4. **Seat Map Visualization**: Create a visual seat map representation for the client
5. **Dynamic Pricing**: Implement more sophisticated pricing models based on demand and flight date
6. **Special Needs Seating**: Add support for special needs seats (extra legroom, accessibility)