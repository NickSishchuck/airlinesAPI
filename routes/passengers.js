const express = require("express");
const router = express.Router();

const {
  getPassengers,
  getPassenger,
  createPassenger,
  updatePassenger,
  deletePassenger,
  getPassengerTickets,
} = require("../controllers/passengerController");

const { protect, authorize } = require("../middleware/auth");
const { validateUser } = require("../middleware/validator");

// Passenger tickets
router.route("/:id/tickets").get(protect, getPassengerTickets);

// Main resource routes
router
  .route("/")
  .get(protect, authorize("admin", "staff"), getPassengers)
  .post(validateUser, createPassenger);

router
  .route("/:id")
  .get(protect, getPassenger)
  .put(protect, validateUser, updatePassenger)
  .delete(protect, authorize("admin"), deletePassenger);

// Add this separately to avoid conflicts with your existing code
const {
  getPassengerByPassport,
} = require("../controllers/passengerController");

// Then add the route
router.get("/passport/:passportNumber", protect, getPassengerByPassport);

module.exports = router;
