# Airline Transportation API

A RESTful API for airline transportation management built with Node.js, Express, and MySQL.

![C++ version](https://github.com/NickSishchuck/airlinesAPI-cpp)

## Overview

This project provides a complete backend system for managing airline operations, including flights, crews, aircraft, routes, passengers, and ticket bookings. The API follows RESTful design principles and implements authentication and role-based authorization.

## Features

- **User Authentication**: Secure JWT-based authentication system
- **Role-Based Access Control**: Admin, worker, and user roles with appropriate permissions
- **Aircraft Management**: CRUD operations for aircraft with crew assignments
- **Crew Management**: Create and manage crews with different roles (captains, pilots, flight attendants)
- **Flight Management**: Schedule flights with routes, aircraft, departure and arrival times
- **Route Management**: Define and manage flight routes with distances and durations
- **Ticket Booking**: Book tickets with seat selection and class options
- **Flight Seat Management**: Advanced seat allocation with different classes (economy, business, first, woman-only)
- **Passenger Management**: User profiles with personal and travel information
- **Flight Pricing**: Dynamic pricing with different class multipliers
- **Reports**: Generate ticket sales reports, flight schedules, and other analytics

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MySQL**: Database
- **JWT**: Authentication
- **Winston**: Logging
- **Dotenv**: Environment variable management
- **Morgan**: HTTP request logging
- **CORS**: Cross-Origin Resource Sharing support

## Installation & Setup

### Prerequisites

- Node.js (v14+)
- MySQL (v8+)
- npm or yarn

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/NickSishchuck/airlinesAPI.git
   cd airline-transportation-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=3000
   DB_HOST=localhost
   DB_USER=airline_user
   DB_PASSWORD=airline_password
   DB_NAME=airline_transportation
   JWT_SECRET=yoursecretkey
   JWT_EXPIRES_IN=30d
   ```

4. Set up the database:
   ```bash
   # Import the SQL schema
   mysql -u root -p < sql_files/all-in-one.sql
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Database Schema

The system uses the following main entities:

- **Routes**: Origin, destination, distance, and estimated duration
- **Crew Members**: Personnel with different roles (captain, pilot, flight attendant)
- **Crews**: Groups of crew members assigned to flights
- **Aircraft**: Information about planes with assigned crews
- **Flights**: Scheduled flights with aircraft, route, and timing information
- **Users**: System users with roles (admin, worker, user)
- **Tickets**: Booked tickets with seat information
- **Flight Seats**: Seat inventory for each flight with different classes

## API Endpoints

### Authentication
- `POST /api/auth/registerEmail` - Register with email
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password
- `GET /api/auth/logout` - Logout

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Aircraft
- `GET /api/aircraft` - Get all aircraft
- `GET /api/aircraft/:id` - Get aircraft by ID
- `POST /api/aircraft` - Create aircraft
- `PUT /api/aircraft/:id` - Update aircraft
- `DELETE /api/aircraft/:id` - Delete aircraft
- `GET /api/aircraft/:id/flights` - Get aircraft flights

### Crews
- `GET /api/crews` - Get all crews
- `GET /api/crews/:id` - Get crew by ID
- `POST /api/crews` - Create crew
- `PUT /api/crews/:id` - Update crew
- `DELETE /api/crews/:id` - Delete crew
- `GET /api/crews/:id/members` - Get crew members
- `POST /api/crews/:id/members` - Assign crew member
- `DELETE /api/crews/:id/members/:memberId` - Remove crew member
- `GET /api/crews/:id/aircraft` - Get crew aircraft
- `GET /api/crews/:id/validate` - Validate crew composition

### Crew Members
- `GET /api/crew-members` - Get all crew members
- `GET /api/crew-members/:id` - Get crew member by ID
- `POST /api/crew-members` - Create crew member
- `PUT /api/crew-members/:id` - Update crew member
- `DELETE /api/crew-members/:id` - Delete crew member
- `GET /api/crew-members/:id/assignments` - Get crew member assignments
- `GET /api/crew-members/:id/flights` - Get crew member flights
- `GET /api/crew-members/search/:lastName` - Search crew members by last name

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get route by ID
- `POST /api/routes` - Create route
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route
- `GET /api/routes/:id/flights` - Get route flights

### Flights
- `GET /api/flights` - Get all flights
- `GET /api/flights/:id` - Get flight by ID
- `POST /api/flights` - Create flight
- `PUT /api/flights/:id` - Update flight
- `DELETE /api/flights/:id` - Delete flight
- `GET /api/flights/flight-number/:flightNumber` - Get flight by number
- `GET /api/flights/search/by-route-date` - Search flights by route and date
- `GET /api/flights/search/by-route` - Search flights by route
- `GET /api/flights/schedule/generate` - Generate flight schedule
- `PATCH /api/flights/:id/cancel` - Cancel flight
- `GET /api/flights/:id/prices` - Get flight prices
- `GET /api/flights/:id/pricing` - Get flight pricing
- `GET /api/flights/:id/crew` - Get flight crew

### Flight Pricing
- `GET /api/flight-pricing` - Get all flight pricing
- `GET /api/flight-pricing/:id` - Get single flight pricing
- `GET /api/flight-pricing/search` - Search flight pricing
- `POST /api/flight-pricing` - Create flight pricing
- `PUT /api/flight-pricing/:id` - Update flight pricing
- `DELETE /api/flight-pricing/:id` - Delete flight pricing

### Flight Seats
- `GET /api/flight-seats/:flightId/seat-map` - Get flight seat map
- `GET /api/flight-seats/:flightId/available/:class` - Get available seats by class
- `GET /api/flight-seats/:flightId/check/:class/:seatNumber` - Check seat availability
- `POST /api/flight-seats/:flightId/validate` - Validate seat for user
- `POST /api/flight-seats/:flightId/initialize` - Initialize flight seats
- `PUT /api/flight-seats/:flightId/reconfigure` - Reconfigure flight seats

### Passengers
- `GET /api/passengers` - Get all passengers
- `GET /api/passengers/:id` - Get passenger by ID
- `POST /api/passengers` - Create passenger
- `PUT /api/passengers/:id` - Update passenger
- `DELETE /api/passengers/:id` - Delete passenger
- `GET /api/passengers/:id/tickets` - Get passenger tickets
- `GET /api/passengers/passport/:passportNumber` - Get passenger by passport

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `POST /api/tickets` - Book ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `GET /api/tickets/:id/print` - Generate printable ticket
- `GET /api/tickets/user/:userId` - Get tickets by user
- `GET /api/tickets/flight/:flightId` - Get tickets by flight
- `GET /api/tickets/flight-number/:flightNumber` - Get tickets by flight number
- `GET /api/tickets/passport/:passportNumber` - Get tickets by passport number
- `GET /api/tickets/reports/sales` - Generate ticket sales report
- `PATCH /api/tickets/:id/payment` - Update ticket payment status
- `GET /api/tickets/flight/:flightId/available-seats/:class?` - Get available seats
- `POST /api/tickets/validate-seat` - Validate seat for booking
- `POST /api/tickets/hold-seat` - Hold a seat temporarily
- `POST /api/tickets/release-seat` - Release a held seat

## Authentication

The API uses JWT (JSON Web Token) for authentication. To access protected routes:

1. Register or login to obtain a token
2. Include the token in the Authorization header of your requests:
   ```
   Authorization: Bearer your-token-here
   ```

## Role-Based Access

The system has three roles:
- **Admin**: Full access to all endpoints
- **Worker**: Access to operational endpoints but limited administrative capabilities
- **User**: Access to personal data and public endpoints

## Error Handling

The API uses standardized error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Logging

The system logs information to:
- Console (in development mode)
- `logs/combined.log` (all levels)
- `logs/error.log` (error level only)

## Development

### Running in Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
