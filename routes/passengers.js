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

router.route("/:id/tickets").get(protect, getPassengerTickets);

router
  .route("/")
  .get(protect, authorize("admin", "staff"), getPassengers)
  .post(validateUser, createPassenger);

router
  .route("/:id")
  .get(protect, getPassenger)
  .put(protect, validateUser, updatePassenger)
  .delete(protect, authorize("admin"), deletePassenger);

const {
  getPassengerByPassport,
} = require("../controllers/passengerController");

router.get("/passport/:passportNumber", protect, getPassengerByPassport);

module.exports = router;
