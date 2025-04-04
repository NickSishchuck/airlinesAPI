/**
 * API Documentation Router
 * 
 * This module provides multiple routes for API documentation, organized by resource type.
 * Routes include:
 * - /api/docs - Main documentation overview
 * - /api/docs/auth - Authentication endpoints
 * - /api/docs/flights - Flight management endpoints
 * - /api/docs/tickets - Ticket management endpoints
 */

const express = require('express');
const router = express.Router();

// Main documentation object containing all API resources
const apiDocumentation = {
  apiName: "Airline Transportation API",
  version: "1.0.0",
  description: "This API provides endpoints for managing an airline transportation system, including routes, flights, aircraft, captains, passengers, and tickets.",
  baseUrl: "http://your-server-ip:3000/api",
  authentication: {
    type: "JWT (JSON Web Token)",
    description: "The API uses JWT for authentication. Include the token in the Authorization header for protected endpoints.",
    example: "Authorization: Bearer your-jwt-token"
  },
  resources: [
    {
      name: "Authentication",
      description: "Endpoints for user registration, login, and authentication management",
      docPath: "/docs/auth"
    },
    {
      name: "Flights",
      description: "Endpoints for flight management, including scheduling, searching, and status updates",
      docPath: "/docs/flights"
    },
    {
      name: "Tickets",
      description: "Endpoints for ticket booking, management, and reporting",
      docPath: "/docs/tickets"
    }
  ],
  errorResponses: {
    description: "All API endpoints follow a consistent error response format",
    format: {
      success: false,
      error: "Error message here"
    },
    statusCodes: [
      { code: "400", description: "Bad Request (missing required fields, validation errors)" },
      { code: "401", description: "Unauthorized (missing or invalid token)" },
      { code: "403", description: "Forbidden (insufficient permissions)" },
      { code: "404", description: "Not Found (resource not found)" },
      { code: "409", description: "Conflict (duplicate entry)" },
      { code: "500", description: "Server Error" }
    ]
  },
  roleBasedAccess: {
    description: "The API implements role-based access control with three roles",
    roles: [
      { name: "passenger", description: "Can manage own tickets and view public flight information" },
      { name: "staff", description: "Can manage flights, view passenger information, and generate reports" },
      { name: "admin", description: "Has full access to all endpoints" }
    ]
  }
};

// Authentication documentation
const authDocs = {
  resourceName: "Authentication API",
  description: "Endpoints for user registration, login, and authentication management",
  endpoints: [
    {
      path: "/auth/register",
      method: "POST",
      description: "Register a new user",
      requestBody: {
        contentType: "application/json",
        schema: {
          name: { type: "string", required: true },
          email: { type: "string", required: true },
          password: { type: "string", required: true }
        },
        example: {
          name: "John Doe",
          email: "john@example.com",
          password: "password123"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          token: "your-jwt-token",
          data: {
            user_id: 1,
            name: "John Doe",
            email: "john@example.com",
            role: "passenger",
            created_at: "2023-01-01T12:00:00.000Z"
          }
        }
      }
    },
    {
      path: "/auth/login",
      method: "POST",
      description: "Login an existing user",
      requestBody: {
        contentType: "application/json",
        schema: {
          email: { type: "string", required: true },
          password: { type: "string", required: true }
        },
        example: {
          email: "john@example.com",
          password: "password123"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          token: "your-jwt-token",
          data: {
            user_id: 1,
            name: "John Doe",
            email: "john@example.com",
            role: "passenger",
            created_at: "2023-01-01T12:00:00.000Z"
          }
        }
      }
    },
    {
      path: "/auth/me",
      method: "GET",
      description: "Get current authenticated user information",
      authentication: true,
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            user_id: 1,
            name: "John Doe",
            email: "john@example.com",
            role: "passenger",
            created_at: "2023-01-01T12:00:00.000Z"
          }
        }
      }
    }
  ]
};

// Flights documentation
const flightDocs = {
  resourceName: "Flights API",
  description: "Endpoints for flight management, including scheduling, searching, and status updates",
  endpoints: [
    {
      path: "/flights",
      method: "GET",
      description: "Get all flights with pagination",
      queryParameters: [
        { name: "page", type: "number", description: "Page number", required: false, default: 1 },
        { name: "limit", type: "number", description: "Items per page", required: false, default: 10 }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 2,
          pagination: {
            page: 1,
            limit: 10,
            totalPages: 1,
            totalItems: 2
          },
          data: [
            {
              flight_id: 1,
              flight_number: "PS101",
              origin: "Kyiv",
              destination: "Lviv",
              departure_time: "2023-01-15T08:00:00.000Z",
              arrival_time: "2023-01-15T09:10:00.000Z",
              status: "scheduled",
              gate: "A1",
              aircraft_model: "Boeing 737-800",
              registration_number: "UR-PSA"
            },
            {
              flight_id: 2,
              flight_number: "PS102",
              origin: "Kyiv",
              destination: "Odesa",
              departure_time: "2023-01-15T12:00:00.000Z",
              arrival_time: "2023-01-15T13:05:00.000Z",
              status: "scheduled",
              gate: "B2",
              aircraft_model: "Airbus A320",
              registration_number: "UR-WDC"
            }
          ]
        }
      }
    },
    {
      path: "/flights/:id",
      method: "GET",
      description: "Get a specific flight by ID",
      pathParameters: [
        { name: "id", type: "number", description: "Flight ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            flight_id: 1,
            flight_number: "PS101",
            route_id: 1,
            origin: "Kyiv",
            destination: "Lviv",
            aircraft_id: 1,
            aircraft_model: "Boeing 737-800",
            registration_number: "UR-PSA",
            departure_time: "2023-01-15T08:00:00.000Z",
            arrival_time: "2023-01-15T09:10:00.000Z",
            status: "scheduled",
            gate: "A1",
            captain_name: "John Smith",
            captain_id: 1,
            booked_seats: 25,
            total_capacity: 189
          }
        }
      }
    },
    {
      path: "/flights/search/by-route-date",
      method: "GET",
      description: "Search flights by route and date",
      queryParameters: [
        { name: "origin", type: "string", description: "Origin city/airport", required: true },
        { name: "destination", type: "string", description: "Destination city/airport", required: true },
        { name: "date", type: "string", description: "Flight date (YYYY-MM-DD)", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 2,
          data: [
            {
              flight_id: 1,
              flight_number: "PS101",
              origin: "Kyiv",
              destination: "Lviv",
              departure_time: "2023-01-15T08:00:00.000Z",
              arrival_time: "2023-01-15T09:10:00.000Z",
              status: "scheduled",
              aircraft_model: "Boeing 737-800",
              registration_number: "UR-PSA",
              captain_name: "John Smith",
              booked_seats: 25,
              total_capacity: 189
            },
            {
              flight_id: 5,
              flight_number: "PS105",
              origin: "Kyiv",
              destination: "Lviv",
              departure_time: "2023-01-15T18:00:00.000Z",
              arrival_time: "2023-01-15T19:10:00.000Z",
              status: "scheduled",
              aircraft_model: "Embraer E190",
              registration_number: "UR-ZKP",
              captain_name: "Oleksandr Kovalenko",
              booked_seats: 15,
              total_capacity: 104
            }
          ]
        }
      }
    },
    {
      path: "/flights/schedule/generate",
      method: "GET",
      description: "Generate flight schedule for a date range",
      queryParameters: [
        { name: "startDate", type: "string", description: "Start date (YYYY-MM-DD)", required: true },
        { name: "endDate", type: "string", description: "End date (YYYY-MM-DD)", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 4,
          data: [
            {
              flight_id: 1,
              flight_number: "PS101",
              origin: "Kyiv",
              destination: "Lviv",
              departure_time: "2023-01-15T08:00:00.000Z",
              arrival_time: "2023-01-15T09:10:00.000Z",
              status: "scheduled",
              gate: "A1",
              aircraft_model: "Boeing 737-800",
              captain_name: "John Smith"
            },
            {
              flight_id: 2,
              flight_number: "PS102",
              origin: "Kyiv",
              destination: "Odesa",
              departure_time: "2023-01-15T12:00:00.000Z",
              arrival_time: "2023-01-15T13:05:00.000Z",
              status: "scheduled",
              gate: "B2",
              aircraft_model: "Airbus A320",
              captain_name: "Maria Johnson"
            }
          ]
        }
      }
    },
    {
      path: "/flights",
      method: "POST",
      description: "Create a new flight",
      authentication: true,
      requestBody: {
        contentType: "application/json",
        schema: {
          flight_number: { type: "string", required: true },
          route_id: { type: "number", required: true },
          aircraft_id: { type: "number", required: true },
          departure_time: { type: "string", required: true },
          arrival_time: { type: "string", required: true },
          status: { type: "string", required: true },
          gate: { type: "string", required: true }
        },
        example: {
          flight_number: "PS110",
          route_id: 1,
          aircraft_id: 2,
          departure_time: "2023-01-22T10:00:00.000Z",
          arrival_time: "2023-01-22T11:10:00.000Z",
          status: "scheduled",
          gate: "C3"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            flight_id: 10,
            flight_number: "PS110",
            route_id: 1,
            origin: "Kyiv",
            destination: "Lviv",
            aircraft_id: 2,
            aircraft_model: "Airbus A320",
            registration_number: "UR-WDC",
            departure_time: "2023-01-22T10:00:00.000Z",
            arrival_time: "2023-01-22T11:10:00.000Z",
            status: "scheduled",
            gate: "C3",
            captain_name: "Maria Johnson",
            captain_id: 2,
            booked_seats: 0,
            total_capacity: 180
          }
        }
      }
    },
    {
      path: "/flights/:id",
      method: "PUT",
      description: "Update a flight",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Flight ID", required: true }
      ],
      requestBody: {
        contentType: "application/json",
        schema: {
          gate: { type: "string", required: false },
          status: { type: "string", required: false }
        },
        example: {
          gate: "D4",
          status: "delayed"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            flight_id: 1,
            flight_number: "PS101",
            route_id: 1,
            origin: "Kyiv",
            destination: "Lviv",
            aircraft_id: 1,
            aircraft_model: "Boeing 737-800",
            registration_number: "UR-PSA",
            departure_time: "2023-01-15T08:00:00.000Z",
            arrival_time: "2023-01-15T09:10:00.000Z",
            status: "delayed",
            gate: "D4",
            captain_name: "John Smith",
            captain_id: 1,
            booked_seats: 25,
            total_capacity: 189
          }
        }
      }
    },
    {
      path: "/flights/:id",
      method: "DELETE",
      description: "Delete a flight",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Flight ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {}
        }
      }
    },
    {
      path: "/flights/:id/cancel",
      method: "PATCH",
      description: "Cancel a flight",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Flight ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            status: "canceled"
          }
        }
      }
    }
  ]
};


// Crews documentation
const crewDocs = {
  resourceName: "Crews API",
  description: "Endpoints for crew management, including crew assignments and validation",
  endpoints: [
    {
      path: "/crews",
      method: "GET",
      description: "Get all crews with pagination",
      authentication: true,
      queryParameters: [
        { name: "page", type: "number", description: "Page number", required: false, default: 1 },
        { name: "limit", type: "number", description: "Items per page", required: false, default: 10 },
        { name: "status", type: "string", description: "Filter by status (active, off-duty)", required: false }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 2,
          pagination: {
            page: 1,
            limit: 10,
            totalPages: 1,
            totalItems: 2
          },
          data: [
            {
              crew_id: 1,
              name: "Red Team",
              status: "active",
              member_count: 4,
              aircraft_count: 1
            },
            {
              crew_id: 2,
              name: "Blue Team",
              status: "active",
              member_count: 4,
              aircraft_count: 2
            }
          ]
        }
      }
    },
    {
      path: "/crews/:id",
      method: "GET",
      description: "Get a specific crew by ID",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            crew_id: 1,
            name: "Red Team",
            status: "active",
            member_count: 4,
            aircraft_count: 1
          }
        }
      }
    },
    {
      path: "/crews/:id/members",
      method: "GET",
      description: "Get crew members assigned to a crew",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 4,
          data: [
            {
              crew_member_id: 1,
              first_name: "John",
              last_name: "Smith",
              role: "captain",
              license_number: "CPT123456",
              experience_years: 15
            },
            {
              crew_member_id: 6,
              first_name: "David",
              last_name: "Wilson",
              role: "pilot",
              license_number: "PLT123456",
              experience_years: 8
            },
            {
              crew_member_id: 11,
              first_name: "Emma",
              last_name: "Davis",
              role: "flight_attendant",
              license_number: null,
              experience_years: 5
            },
            {
              crew_member_id: 12,
              first_name: "Olena",
              last_name: "Tkachuk",
              role: "flight_attendant",
              license_number: null,
              experience_years: 4
            }
          ]
        }
      }
    },
    {
      path: "/crews/:id/members",
      method: "POST",
      description: "Assign a crew member to a crew",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew ID", required: true }
      ],
      requestBody: {
        contentType: "application/json",
        schema: {
          crew_member_id: { type: "number", required: true }
        },
        example: {
          crew_member_id: 8
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 5,
          data: [
            {
              crew_member_id: 1,
              first_name: "John",
              last_name: "Smith",
              role: "captain",
              license_number: "CPT123456",
              experience_years: 15
            },
            // ... other members ...
            {
              crew_member_id: 8,
              first_name: "Igor",
              last_name: "Petrov",
              role: "pilot",
              license_number: "PLT345678",
              experience_years: 10
            }
          ]
        }
      }
    },
    {
      path: "/crews/:id/members/:memberId",
      method: "DELETE",
      description: "Remove a crew member from a crew",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew ID", required: true },
        { name: "memberId", type: "number", description: "Crew Member ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 3,
          data: [
            {
              crew_member_id: 1,
              first_name: "John",
              last_name: "Smith",
              role: "captain",
              license_number: "CPT123456",
              experience_years: 15
            },
            // ... remaining members ...
          ]
        }
      }
    },
    {
      path: "/crews/:id/validate",
      method: "GET",
      description: "Validate crew composition",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            valid: true,
            messages: []
          }
        }
      }
    },
    {
      path: "/crews/:id/aircraft",
      method: "GET",
      description: "Get aircraft assigned to a crew",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 1,
          data: [
            {
              aircraft_id: 1,
              model: "Boeing 737-800",
              registration_number: "UR-PSA",
              capacity: 189,
              status: "active"
            }
          ]
        }
      }
    },
    {
      path: "/crews",
      method: "POST",
      description: "Create a new crew",
      authentication: true,
      requestBody: {
        contentType: "application/json",
        schema: {
          name: { type: "string", required: true },
          status: { type: "string", required: false, default: "active" }
        },
        example: {
          name: "Orange Team",
          status: "active"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            crew_id: 6,
            name: "Orange Team",
            status: "active",
            member_count: 0,
            aircraft_count: 0
          }
        }
      }
    },
    {
      path: "/crews/:id",
      method: "PUT",
      description: "Update a crew",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew ID", required: true }
      ],
      requestBody: {
        contentType: "application/json",
        schema: {
          name: { type: "string", required: false },
          status: { type: "string", required: false }
        },
        example: {
          name: "Orange Team Alpha",
          status: "off-duty"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            crew_id: 6,
            name: "Orange Team Alpha",
            status: "off-duty",
            member_count: 0,
            aircraft_count: 0
          }
        }
      }
    },
    {
      path: "/crews/:id",
      method: "DELETE",
      description: "Delete a crew",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {}
        }
      }
    }
  ]
};

// Crew Members documentation
const crewMemberDocs = {
  resourceName: "Crew Members API",
  description: "Endpoints for managing individual crew members (captains, pilots, flight attendants)",
  endpoints: [
    {
      path: "/crew-members",
      method: "GET",
      description: "Get all crew members with pagination",
      authentication: true,
      queryParameters: [
        { name: "page", type: "number", description: "Page number", required: false, default: 1 },
        { name: "limit", type: "number", description: "Items per page", required: false, default: 10 },
        { name: "role", type: "string", description: "Filter by role (captain, pilot, flight_attendant)", required: false }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 2,
          pagination: {
            page: 1,
            limit: 10,
            totalPages: 1,
            totalItems: 2
          },
          data: [
            {
              crew_member_id: 1,
              first_name: "John",
              last_name: "Smith",
              role: "captain",
              license_number: "CPT123456",
              date_of_birth: "1975-05-10",
              experience_years: 15,
              contact_number: "+380501234567",
              email: "john.smith@airline.com",
              crew_count: 1
            },
            {
              crew_member_id: 2,
              first_name: "Maria",
              last_name: "Johnson",
              role: "captain",
              license_number: "CPT789012",
              date_of_birth: "1980-03-22",
              experience_years: 12,
              contact_number: "+380502345678",
              email: "maria.johnson@airline.com",
              crew_count: 1
            }
          ]
        }
      }
    },
    {
      path: "/crew-members/:id",
      method: "GET",
      description: "Get a specific crew member by ID",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew Member ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            crew_member_id: 1,
            first_name: "John",
            last_name: "Smith",
            role: "captain",
            license_number: "CPT123456",
            date_of_birth: "1975-05-10",
            experience_years: 15,
            contact_number: "+380501234567",
            email: "john.smith@airline.com",
            crew_count: 1
          }
        }
      }
    },
    {
      path: "/crew-members/:id/assignments",
      method: "GET",
      description: "Get crews that a crew member is assigned to",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew Member ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 1,
          data: [
            {
              crew_id: 1,
              name: "Red Team",
              status: "active",
              member_count: 4
            }
          ]
        }
      }
    },
    {
      path: "/crew-members/:id/flights",
      method: "GET",
      description: "Get flights for a crew member",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew Member ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 2,
          data: [
            {
              flight_id: 1,
              flight_number: "PS101",
              origin: "Kyiv",
              destination: "Lviv",
              departure_time: "2025-04-05T08:00:00.000Z",
              arrival_time: "2025-04-05T09:10:00.000Z",
              status: "scheduled",
              aircraft_model: "Boeing 737-800",
              registration_number: "UR-PSA"
            },
            {
              flight_id: 2,
              flight_number: "PS102",
              origin: "Kyiv",
              destination: "Odesa",
              departure_time: "2025-04-05T12:00:00.000Z",
              arrival_time: "2025-04-05T13:05:00.000Z",
              status: "scheduled",
              aircraft_model: "Boeing 737-800",
              registration_number: "UR-PSA"
            }
          ]
        }
      }
    },
    {
      path: "/crew-members",
      method: "POST",
      description: "Create a new crew member",
      authentication: true,
      requestBody: {
        contentType: "application/json",
        schema: {
          first_name: { type: "string", required: true },
          last_name: { type: "string", required: true },
          role: { type: "string", required: true },
          license_number: { type: "string", required: false },
          date_of_birth: { type: "string", required: true },
          experience_years: { type: "number", required: true },
          contact_number: { type: "string", required: true },
          email: { type: "string", required: true }
        },
        example: {
          first_name: "Alex",
          last_name: "Johnson",
          role: "pilot",
          license_number: "PLT987654",
          date_of_birth: "1985-08-15",
          experience_years: 8,
          contact_number: "+380509876543",
          email: "alex.johnson@airline.com"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            crew_member_id: 19,
            first_name: "Alex",
            last_name: "Johnson",
            role: "pilot",
            license_number: "PLT987654",
            date_of_birth: "1985-08-15",
            experience_years: 8,
            contact_number: "+380509876543",
            email: "alex.johnson@airline.com",
            crew_count: 0
          }
        }
      }
    },
    {
      path: "/crew-members/:id",
      method: "PUT",
      description: "Update a crew member",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew Member ID", required: true }
      ],
      requestBody: {
        contentType: "application/json",
        schema: {
          first_name: { type: "string", required: false },
          last_name: { type: "string", required: false },
          role: { type: "string", required: false },
          license_number: { type: "string", required: false },
          date_of_birth: { type: "string", required: false },
          experience_years: { type: "number", required: false },
          contact_number: { type: "string", required: false },
          email: { type: "string", required: false }
        },
        example: {
          experience_years: 9,
          contact_number: "+380509876544"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            crew_member_id: 19,
            first_name: "Alex",
            last_name: "Johnson",
            role: "pilot",
            license_number: "PLT987654",
            date_of_birth: "1985-08-15",
            experience_years: 9,
            contact_number: "+380509876544",
            email: "alex.johnson@airline.com",
            crew_count: 0
          }
        }
      }
    },
    {
      path: "/crew-members/:id",
      method: "DELETE",
      description: "Delete a crew member",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Crew Member ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {}
        }
      }
    }
  ]
};

// Update flights documentation section to include base_price information
// In a complete implementation, you would update other sections as well

/**
 * Register new documentation routes
 * 
 * Route handler for Crews documentation
 * GET /api/docs/crews
 */
router.get('/docs/crews', (req, res) => {
  res.json(crewDocs);
});

/**
 * Route handler for Crew Members documentation
 * GET /api/docs/crew-members
 */
router.get('/docs/crew-members', (req, res) => {
  res.json(crewMemberDocs);
});

// Add these resources to the main documentation object
apiDocumentation.resources.push(
  {
    name: "Crews",
    description: "Endpoints for crew management including assignment and validation",
    docPath: "/docs/crews"
  },
  {
    name: "Crew Members",
    description: "Endpoints for managing individual crew members (captains, pilots, flight attendants)",
    docPath: "/docs/crew-members"
  }
);

// Tickets documentation
const ticketDocs = {
  resourceName: "Tickets API",
  description: "Endpoints for ticket booking, management, and reporting",
  endpoints: [
    {
      path: "/tickets",
      method: "GET",
      description: "Get all tickets with pagination",
      authentication: true,
      queryParameters: [
        { name: "page", type: "number", description: "Page number", required: false, default: 1 },
        { name: "limit", type: "number", description: "Items per page", required: false, default: 10 }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 2,
          pagination: {
            page: 1,
            limit: 10,
            totalPages: 1,
            totalItems: 2
          },
          data: [
            {
              ticket_id: 1,
              seat_number: "12A",
              class: "economy",
              price: 950.00,
              booking_date: "2023-01-10T14:23:45.000Z",
              payment_status: "completed",
              flight_number: "PS101",
              departure_time: "2023-01-15T08:00:00.000Z",
              arrival_time: "2023-01-15T09:10:00.000Z",
              origin: "Kyiv",
              destination: "Lviv",
              passenger_name: "Anna Kovalenko",
              passport_number: "FD123456"
            },
            {
              ticket_id: 2,
              seat_number: "3F",
              class: "business",
              price: 2500.00,
              booking_date: "2023-01-11T09:15:30.000Z",
              payment_status: "completed",
              flight_number: "PS102",
              departure_time: "2023-01-15T12:00:00.000Z",
              arrival_time: "2023-01-15T13:05:00.000Z",
              origin: "Kyiv",
              destination: "Odesa",
              passenger_name: "Mykhailo Shevchenko",
              passport_number: "FD789012"
            }
          ]
        }
      }
    },
    {
      path: "/tickets/:id",
      method: "GET",
      description: "Get a specific ticket by ID",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Ticket ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            ticket_id: 1,
            passenger_id: 1,
            flight_id: 1,
            seat_number: "12A",
            class: "economy",
            price: 950.00,
            booking_date: "2023-01-10T14:23:45.000Z",
            payment_status: "completed",
            flight_number: "PS101",
            departure_time: "2023-01-15T08:00:00.000Z",
            arrival_time: "2023-01-15T09:10:00.000Z",
            flight_status: "scheduled",
            gate: "A1",
            origin: "Kyiv",
            destination: "Lviv",
            passenger_name: "Anna Kovalenko",
            passport_number: "FD123456",
            aircraft_model: "Boeing 737-800",
            registration_number: "UR-PSA"
          }
        }
      }
    },
    {
      path: "/tickets/:id/print",
      method: "GET",
      description: "Generate a printable ticket",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Ticket ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            ticket_id: 1,
            seat_number: "12A",
            class: "economy",
            price: 950.00,
            flight_number: "PS101",
            origin: "Kyiv",
            destination: "Lviv",
            departure_time: "2023-01-15T08:00:00.000Z",
            arrival_time: "2023-01-15T09:10:00.000Z",
            gate: "A1",
            passenger_name: "Anna Kovalenko",
            passport_number: "FD123456",
            aircraft_model: "Boeing 737-800",
            aircraft_registration: "UR-PSA"
          }
        }
      }
    },
    {
      path: "/tickets/passenger/:passengerId",
      method: "GET",
      description: "Get tickets by passenger ID",
      authentication: true,
      pathParameters: [
        { name: "passengerId", type: "number", description: "Passenger ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 2,
          data: [
            {
              ticket_id: 1,
              seat_number: "12A",
              class: "economy",
              price: 950.00,
              booking_date: "2023-01-10T14:23:45.000Z",
              payment_status: "completed",
              flight_number: "PS101",
              departure_time: "2023-01-15T08:00:00.000Z",
              arrival_time: "2023-01-15T09:10:00.000Z",
              origin: "Kyiv",
              destination: "Lviv",
              flight_status: "scheduled"
            },
            {
              ticket_id: 5,
              seat_number: "7C",
              class: "economy",
              price: 1150.00,
              booking_date: "2023-01-12T16:42:10.000Z",
              payment_status: "completed",
              flight_number: "PS105",
              departure_time: "2023-01-17T14:30:00.000Z",
              arrival_time: "2023-01-17T16:40:00.000Z",
              origin: "Kyiv",
              destination: "Vienna",
              flight_status: "scheduled"
            }
          ]
        }
      }
    },
    {
      path: "/tickets/flight/:flightId",
      method: "GET",
      description: "Get tickets by flight ID",
      authentication: true,
      pathParameters: [
        { name: "flightId", type: "number", description: "Flight ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 2,
          data: [
            {
              ticket_id: 1,
              seat_number: "12A",
              class: "economy",
              price: 950.00,
              passenger_name: "Anna Kovalenko",
              passport_number: "FD123456",
              payment_status: "completed"
            },
            {
              ticket_id: 3,
              seat_number: "15D",
              class: "economy",
              price: 950.00,
              passenger_name: "Julia Melnyk",
              passport_number: "FD345678",
              payment_status: "completed"
            }
          ]
        }
      }
    },
    {
      path: "/tickets/reports/sales",
      method: "GET",
      description: "Generate ticket sales report",
      authentication: true,
      queryParameters: [
        { name: "startDate", type: "string", description: "Start date (YYYY-MM-DD)", required: true },
        { name: "endDate", type: "string", description: "End date (YYYY-MM-DD)", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          count: 3,
          data: [
            {
              flight_number: "PS101",
              origin: "Kyiv",
              destination: "Lviv",
              flight_date: "2023-01-15",
              tickets_sold: 25,
              total_revenue: 28500.00,
              ticket_class: "economy",
              total_capacity: 189,
              occupancy_percentage: 13.23
            },
            {
              flight_number: "PS101",
              origin: "Kyiv",
              destination: "Lviv",
              flight_date: "2023-01-15",
              tickets_sold: 5,
              total_revenue: 12500.00,
              ticket_class: "business",
              total_capacity: 189,
              occupancy_percentage: 2.65
            },
            {
              flight_number: "PS102",
              origin: "Kyiv",
              destination: "Odesa",
              flight_date: "2023-01-15",
              tickets_sold: 30,
              total_revenue: 32000.00,
              ticket_class: "economy",
              total_capacity: 180,
              occupancy_percentage: 16.67
            }
          ]
        }
      }
    },
    {
      path: "/tickets",
      method: "POST",
      description: "Book a new ticket",
      authentication: true,
      requestBody: {
        contentType: "application/json",
        schema: {
          passenger_id: { type: "number", required: true },
          flight_id: { type: "number", required: true },
          seat_number: { type: "string", required: true },
          class: { type: "string", required: true },
          price: { type: "number", required: true },
          payment_status: { type: "string", required: true }
        },
        example: {
          passenger_id: 1,
          flight_id: 3,
          seat_number: "8B",
          class: "economy",
          price: 1050.00,
          payment_status: "pending"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            ticket_id: 10,
            passenger_id: 1,
            flight_id: 3,
            seat_number: "8B",
            class: "economy",
            price: 1050.00,
            booking_date: "2023-01-14T10:25:33.000Z",
            payment_status: "pending",
            flight_number: "PS103",
            departure_time: "2023-01-16T10:00:00.000Z",
            arrival_time: "2023-01-16T11:00:00.000Z",
            flight_status: "scheduled",
            gate: "A3",
            origin: "Kyiv",
            destination: "Kharkiv",
            passenger_name: "Anna Kovalenko",
            passport_number: "FD123456",
            aircraft_model: "Embraer E190",
            registration_number: "UR-ZKP"
          }
        }
      }
    },
    {
      path: "/tickets/:id",
      method: "PUT",
      description: "Update a ticket",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Ticket ID", required: true }
      ],
      requestBody: {
        contentType: "application/json",
        schema: {
          seat_number: { type: "string", required: false }
        },
        example: {
          seat_number: "9C"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            ticket_id: 10,
            passenger_id: 1,
            flight_id: 3,
            seat_number: "9C",
            class: "economy",
            price: 1050.00,
            booking_date: "2023-01-14T10:25:33.000Z",
            payment_status: "pending",
            flight_number: "PS103",
            departure_time: "2023-01-16T10:00:00.000Z",
            arrival_time: "2023-01-16T11:00:00.000Z",
            flight_status: "scheduled",
            gate: "A3",
            origin: "Kyiv",
            destination: "Kharkiv",
            passenger_name: "Anna Kovalenko",
            passport_number: "FD123456",
            aircraft_model: "Embraer E190",
            registration_number: "UR-ZKP"
          }
        }
      }
    },
    {
      path: "/tickets/:id",
      method: "DELETE",
      description: "Delete a ticket",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Ticket ID", required: true }
      ],
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {}
        }
      }
    },
    {
      path: "/tickets/:id/payment",
      method: "PATCH",
      description: "Update ticket payment status",
      authentication: true,
      pathParameters: [
        { name: "id", type: "number", description: "Ticket ID", required: true }
      ],
      requestBody: {
        contentType: "application/json",
        schema: {
          payment_status: { type: "string", required: true }
        },
        example: {
          payment_status: "completed"
        }
      },
      response: {
        contentType: "application/json",
        example: {
          success: true,
          data: {
            payment_status: "completed"
          }
        }
      }
    }
  ]
};

/**
 * Main route handler for API documentation
 * GET /api/docs
 */
router.get('/docs', (req, res) => {
  res.json(apiDocumentation);
});

/**
 * Route handler for Authentication documentation
 * GET /api/docs/auth
 */
router.get('/docs/auth', (req, res) => {
  res.json(authDocs);
});

/**
 * Route handler for Flight documentation
 * GET /api/docs/flights
 */
router.get('/docs/flights', (req, res) => {
  res.json(flightDocs);
});

/**
 * Route handler for Ticket documentation
 * GET /api/docs/tickets
 */
router.get('/docs/tickets', (req, res) => {
  res.json(ticketDocs);
});

module.exports = router;

/**
 * Integration with main application
 * 
 * In your main app.js or server.js file, incorporate this route as follows:
 * 
 * const express = require('express');
 * const app = express();
 * 
 * // Import the documentation router
 * const docsRouter = require('./path/to/this/file');
 * 
 * // Mount the router at the /api path
 * app.use('/api', docsRouter);
 * 
 * app.listen(3000, () => {
 *   console.log('Server running on port 3000');
 * });
 */