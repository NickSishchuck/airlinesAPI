# Airline Transportation API - Database Schema Update


## Major Changes

### 1. Crew Management System

The previous database design had a direct relationship between aircraft and captains. The new system introduces a more flexible and realistic crew management approach:

- **Crew Members Table**: Replaces the `captains` table with a more general `crew_members` table that can store different roles:
  - Captains
  - Pilots
  - Flight Attendants

- **Crews Table**: New table that represents flight teams
  - Each crew can have multiple members with different roles
  - Crews have active/off-duty status
  
- **Crew Assignments**: Junction table that manages many-to-many relationships between crews and crew members

### 2. Aircraft Assignment

- Aircraft now reference a `crew_id` instead of a `captain_id`
- Each aircraft is assigned a complete crew instead of just a captain
- Includes validation to ensure proper crew composition for flight safety
- Qualification checks to match crew experience with aircraft models

### 3. Flight Pricing Model

- Added `base_price` field to flights table
- Implemented dynamic ticket pricing based on:
  - Flight base price
  - Ticket class multipliers
    - Economy: 1.0x base price
    - Business: 2.5x base price
    - First: 4.0x base price

## API Endpoints

### New Endpoints

#### Crews

- `GET /api/crews` - Get all crews
- `GET /api/crews/:id` - Get single crew
- `POST /api/crews` - Create crew
- `PUT /api/crews/:id` - Update crew
- `DELETE /api/crews/:id` - Delete crew
- `GET /api/crews/:id/members` - Get crew members
- `POST /api/crews/:id/members` - Assign crew member
- `DELETE /api/crews/:id/members/:memberId` - Remove crew member
- `GET /api/crews/:id/aircraft` - Get assigned aircraft
- `GET /api/crews/:id/validate` - Validate crew composition

#### Crew Members

- `GET /api/crew-members` - Get all crew members
- `GET /api/crew-members/:id` - Get single crew member
- `POST /api/crew-members` - Create crew member
- `PUT /api/crew-members/:id` - Update crew member
- `DELETE /api/crew-members/:id` - Delete crew member
- `GET /api/crew-members/:id/assignments` - Get crew assignments
- `GET /api/crew-members/:id/flights` - Get assigned flights

#### Updated Endpoints

- `GET /api/flights/:id/prices` - Get ticket prices for different classes
- `GET /api/tickets/flight/:flightId/available-seats` - Get available seats

### Updated Models

- **Aircraft Model**: Now works with crews instead of individual captains
- **Flight Model**: Added support for base price and price calculations
- **Ticket Model**: Updated to use flight base price for ticket pricing

## Implementation Details

### Database Changes

1. **New Tables**:
   - `crew_members` - Stores all flight staff
   - `crews` - Represents teams
   - `crew_assignments` - Manages many-to-many relationships

2. **Modified Tables**:
   - `aircraft` - Changed FK from `captain_id` to `crew_id`
   - `flights` - Added `base_price` column

### API Impacts

1. **Controllers**:
   - New controllers for crews and crew members
   - Updated controllers for aircraft, flights, and tickets

2. **Models**:
   - New models for crew and crew member management
   - Updates to existing models to work with the new schema

3. **Routes**:
   - New route files for crews and crew members
   - Updated routes for existing resources

