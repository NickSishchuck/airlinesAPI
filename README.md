# Airline Transportation API Documentation

## Overview

This API provides endpoints for managing an airline transportation system, including routes, flights, aircraft, captains, passengers, and tickets.

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Token) for authentication.

### Authentication Endpoints

#### Register a new user

```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "your-jwt-token",
  "data": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "passenger",
    "created_at": "2023-01-01T12:00:00.000Z"
  }
}
```

#### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "your-jwt-token",
  "data": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "passenger",
    "created_at": "2023-01-01T12:00:00.000Z"
  }
}
```

#### Get Current User

```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "passenger",
    "created_at": "2023-01-01T12:00:00.000Z"
  }
}
```

## Flights

### Get All Flights

```
GET /flights
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalItems": 2
  },
  "data": [
    {
      "flight_id": 1,
      "flight_number": "PS101",
      "origin": "Kyiv",
      "destination": "Lviv",
      "departure_time": "2023-01-15T08:00:00.000Z",
      "arrival_time": "2023-01-15T09:10:00.000Z",
      "status": "scheduled",
      "gate": "A1",
      "aircraft_model": "Boeing 737-800",
      "registration_number": "UR-PSA"
    },
    {
      "flight_id": 2,
      "flight_number": "PS102",
      "origin": "Kyiv",
      "destination": "Odesa",
      "departure_time": "2023-01-15T12:00:00.000Z",
      "arrival_time": "2023-01-15T13:05:00.000Z",
      "status": "scheduled",
      "gate": "B2",
      "aircraft_model": "Airbus A320",
      "registration_number": "UR-WDC"
    }
  ]
}
```

### Get Flight by ID

```
GET /flights/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flight_id": 1,
    "flight_number": "PS101",
    "route_id": 1,
    "origin": "Kyiv",
    "destination": "Lviv",
    "aircraft_id": 1,
    "aircraft_model": "Boeing 737-800",
    "registration_number": "UR-PSA",
    "departure_time": "2023-01-15T08:00:00.000Z",
    "arrival_time": "2023-01-15T09:10:00.000Z",
    "status": "scheduled",
    "gate": "A1",
    "captain_name": "John Smith",
    "captain_id": 1,
    "booked_seats": 25,
    "total_capacity": 189
  }
}
```

### Search Flights by Route and Date

```
GET /flights/search/by-route-date?origin=Kyiv&destination=Lviv&date=2023-01-15
```

**Query Parameters:**
- `origin`: Origin city/airport
- `destination`: Destination city/airport
- `date`: Flight date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "flight_id": 1,
      "flight_number": "PS101",
      "origin": "Kyiv",
      "destination": "Lviv",
      "departure_time": "2023-01-15T08:00:00.000Z",
      "arrival_time": "2023-01-15T09:10:00.000Z",
      "status": "scheduled",
      "aircraft_model": "Boeing 737-800",
      "registration_number": "UR-PSA",
      "captain_name": "John Smith",
      "booked_seats": 25,
      "total_capacity": 189
    },
    {
      "flight_id": 5,
      "flight_number": "PS105",
      "origin": "Kyiv",
      "destination": "Lviv",
      "departure_time": "2023-01-15T18:00:00.000Z",
      "arrival_time": "2023-01-15T19:10:00.000Z",
      "status": "scheduled",
      "aircraft_model": "Embraer E190",
      "registration_number": "UR-ZKP",
      "captain_name": "Oleksandr Kovalenko",
      "booked_seats": 15,
      "total_capacity": 104
    }
  ]
}
```

### Generate Flight Schedule

```
GET /flights/schedule/generate?startDate=2023-01-15&endDate=2023-01-21
```

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "flight_id": 1,
      "flight_number": "PS101",
      "origin": "Kyiv",
      "destination": "Lviv",
      "departure_time": "2023-01-15T08:00:00.000Z",
      "arrival_time": "2023-01-15T09:10:00.000Z",
      "status": "scheduled",
      "gate": "A1",
      "aircraft_model": "Boeing 737-800",
      "captain_name": "John Smith"
    },
    {
      "flight_id": 2,
      "flight_number": "PS102",
      "origin": "Kyiv",
      "destination": "Odesa",
      "departure_time": "2023-01-15T12:00:00.000Z",
      "arrival_time": "2023-01-15T13:05:00.000Z",
      "status": "scheduled",
      "gate": "B2",
      "aircraft_model": "Airbus A320",
      "captain_name": "Maria Johnson"
    }
    // More flights...
  ]
}
```

### Create a Flight

```
POST /flights
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Request Body:**
```json
{
  "flight_number": "PS110",
  "route_id": 1,
  "aircraft_id": 2,
  "departure_time": "2023-01-22T10:00:00.000Z",
  "arrival_time": "2023-01-22T11:10:00.000Z",
  "status": "scheduled",
  "gate": "C3"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flight_id": 10,
    "flight_number": "PS110",
    "route_id": 1,
    "origin": "Kyiv",
    "destination": "Lviv",
    "aircraft_id": 2,
    "aircraft_model": "Airbus A320",
    "registration_number": "UR-WDC",
    "departure_time": "2023-01-22T10:00:00.000Z",
    "arrival_time": "2023-01-22T11:10:00.000Z",
    "status": "scheduled",
    "gate": "C3",
    "captain_name": "Maria Johnson",
    "captain_id": 2,
    "booked_seats": 0,
    "total_capacity": 180
  }
}
```

### Update a Flight

```
PUT /flights/:id
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Request Body:**
```json
{
  "gate": "D4",
  "status": "delayed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flight_id": 1,
    "flight_number": "PS101",
    "route_id": 1,
    "origin": "Kyiv",
    "destination": "Lviv",
    "aircraft_id": 1,
    "aircraft_model": "Boeing 737-800",
    "registration_number": "UR-PSA",
    "departure_time": "2023-01-15T08:00:00.000Z",
    "arrival_time": "2023-01-15T09:10:00.000Z",
    "status": "delayed",
    "gate": "D4",
    "captain_name": "John Smith",
    "captain_id": 1,
    "booked_seats": 25,
    "total_capacity": 189
  }
}
```

### Delete a Flight

```
DELETE /flights/:id
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Cancel a Flight

```
PATCH /flights/:id/cancel
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "canceled"
  }
}
```

## Tickets

### Get All Tickets

```
GET /tickets
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalItems": 2
  },
  "data": [
    {
      "ticket_id": 1,
      "seat_number": "12A",
      "class": "economy",
      "price": 950.00,
      "booking_date": "2023-01-10T14:23:45.000Z",
      "payment_status": "completed",
      "flight_number": "PS101",
      "departure_time": "2023-01-15T08:00:00.000Z",
      "arrival_time": "2023-01-15T09:10:00.000Z",
      "origin": "Kyiv",
      "destination": "Lviv",
      "passenger_name": "Anna Kovalenko",
      "passport_number": "FD123456"
    },
    {
      "ticket_id": 2,
      "seat_number": "3F",
      "class": "business",
      "price": 2500.00,
      "booking_date": "2023-01-11T09:15:30.000Z",
      "payment_status": "completed",
      "flight_number": "PS102",
      "departure_time": "2023-01-15T12:00:00.000Z",
      "arrival_time": "2023-01-15T13:05:00.000Z",
      "origin": "Kyiv",
      "destination": "Odesa",
      "passenger_name": "Mykhailo Shevchenko",
      "passport_number": "FD789012"
    }
  ]
}
```

### Get Ticket by ID

```
GET /tickets/:id
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket_id": 1,
    "passenger_id": 1,
    "flight_id": 1,
    "seat_number": "12A",
    "class": "economy",
    "price": 950.00,
    "booking_date": "2023-01-10T14:23:45.000Z",
    "payment_status": "completed",
    "flight_number": "PS101",
    "departure_time": "2023-01-15T08:00:00.000Z",
    "arrival_time": "2023-01-15T09:10:00.000Z",
    "flight_status": "scheduled",
    "gate": "A1",
    "origin": "Kyiv",
    "destination": "Lviv",
    "passenger_name": "Anna Kovalenko",
    "passport_number": "FD123456",
    "aircraft_model": "Boeing 737-800",
    "registration_number": "UR-PSA"
  }
}
```

### Generate Printable Ticket

```
GET /tickets/:id/print
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket_id": 1,
    "seat_number": "12A",
    "class": "economy",
    "price": 950.00,
    "flight_number": "PS101",
    "origin": "Kyiv",
    "destination": "Lviv",
    "departure_time": "2023-01-15T08:00:00.000Z",
    "arrival_time": "2023-01-15T09:10:00.000Z",
    "gate": "A1",
    "passenger_name": "Anna Kovalenko",
    "passport_number": "FD123456",
    "aircraft_model": "Boeing 737-800",
    "aircraft_registration": "UR-PSA"
  }
}
```

### Get Tickets by Passenger ID

```
GET /tickets/passenger/:passengerId
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "ticket_id": 1,
      "seat_number": "12A",
      "class": "economy",
      "price": 950.00,
      "booking_date": "2023-01-10T14:23:45.000Z",
      "payment_status": "completed",
      "flight_number": "PS101",
      "departure_time": "2023-01-15T08:00:00.000Z",
      "arrival_time": "2023-01-15T09:10:00.000Z",
      "origin": "Kyiv",
      "destination": "Lviv",
      "flight_status": "scheduled"
    },
    {
      "ticket_id": 5,
      "seat_number": "7C",
      "class": "economy",
      "price": 1150.00,
      "booking_date": "2023-01-12T16:42:10.000Z",
      "payment_status": "completed",
      "flight_number": "PS105",
      "departure_time": "2023-01-17T14:30:00.000Z",
      "arrival_time": "2023-01-17T16:40:00.000Z",
      "origin": "Kyiv",
      "destination": "Vienna",
      "flight_status": "scheduled"
    }
  ]
}
```

### Get Tickets by Flight ID

```
GET /tickets/flight/:flightId
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "ticket_id": 1,
      "seat_number": "12A",
      "class": "economy",
      "price": 950.00,
      "passenger_name": "Anna Kovalenko",
      "passport_number": "FD123456",
      "payment_status": "completed"
    },
    {
      "ticket_id": 3,
      "seat_number": "15D",
      "class": "economy",
      "price": 950.00,
      "passenger_name": "Julia Melnyk",
      "passport_number": "FD345678",
      "payment_status": "completed"
    }
  ]
}
```

### Generate Ticket Sales Report

```
GET /tickets/reports/sales?startDate=2023-01-01&endDate=2023-01-31
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "flight_number": "PS101",
      "origin": "Kyiv",
      "destination": "Lviv",
      "flight_date": "2023-01-15",
      "tickets_sold": 25,
      "total_revenue": 28500.00,
      "ticket_class": "economy",
      "total_capacity": 189,
      "occupancy_percentage": 13.23
    },
    {
      "flight_number": "PS101",
      "origin": "Kyiv",
      "destination": "Lviv",
      "flight_date": "2023-01-15",
      "tickets_sold": 5,
      "total_revenue": 12500.00,
      "ticket_class": "business",
      "total_capacity": 189,
      "occupancy_percentage": 2.65
    },
    {
      "flight_number": "PS102",
      "origin": "Kyiv",
      "destination": "Odesa",
      "flight_date": "2023-01-15",
      "tickets_sold": 30,
      "total_revenue": 32000.00,
      "ticket_class": "economy",
      "total_capacity": 180,
      "occupancy_percentage": 16.67
    }
  ]
}
```

### Book a Ticket

```
POST /tickets
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Request Body:**
```json
{
  "passenger_id": 1,
  "flight_id": 3,
  "seat_number": "8B",
  "class": "economy",
  "price": 1050.00,
  "payment_status": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket_id": 10,
    "passenger_id": 1,
    "flight_id": 3,
    "seat_number": "8B",
    "class": "economy",
    "price": 1050.00,
    "booking_date": "2023-01-14T10:25:33.000Z",
    "payment_status": "pending",
    "flight_number": "PS103",
    "departure_time": "2023-01-16T10:00:00.000Z",
    "arrival_time": "2023-01-16T11:00:00.000Z",
    "flight_status": "scheduled",
    "gate": "A3",
    "origin": "Kyiv",
    "destination": "Kharkiv",
    "passenger_name": "Anna Kovalenko",
    "passport_number": "FD123456",
    "aircraft_model": "Embraer E190",
    "registration_number": "UR-ZKP"
  }
}
```

### Update a Ticket

```
PUT /tickets/:id
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Request Body:**
```json
{
  "seat_number": "9C"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket_id": 10,
    "passenger_id": 1,
    "flight_id": 3,
    "seat_number": "9C",
    "class": "economy",
    "price": 1050.00,
    "booking_date": "2023-01-14T10:25:33.000Z",
    "payment_status": "pending",
    "flight_number": "PS103",
    "departure_time": "2023-01-16T10:00:00.000Z",
    "arrival_time": "2023-01-16T11:00:00.000Z",
    "flight_status": "scheduled",
    "gate": "A3",
    "origin": "Kyiv",
    "destination": "Kharkiv",
    "passenger_name": "Anna Kovalenko",
    "passport_number": "FD123456",
    "aircraft_model": "Embraer E190",
    "registration_number": "UR-ZKP"
  }
}
```

### Delete a Ticket

```
DELETE /tickets/:id
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Update Ticket Payment Status

```
PATCH /tickets/:id/payment
```

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Request Body:**
```json
{
  "payment_status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_status": "completed"
  }
}
```

## Error Responses

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common error status codes:
- `400` - Bad Request (missing required fields, validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (duplicate entry)
- `500` - Server Error

## Role-Based Access Control

The API implements role-based access control with three roles:
- `passenger` - Can manage own tickets and view public flight information
- `staff` - Can manage flights, view passenger information, and generate reports
- `admin` - Has full access to all endpoints