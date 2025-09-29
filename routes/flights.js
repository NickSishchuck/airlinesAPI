const express = require("express");
const router = express.Router();
const {
  getFlights,
  getFlight,
  createFlight,
  updateFlight,
  deleteFlight,
  searchFlightsByRouteAndDate,
  searchFlightsByRoute,
  generateFlightSchedule,
  cancelFlight,
  getFlightPrices,
  getFlightCrew,
  getFlightByNumber,
} = require("../controllers/flightController");

const { getFlightPricingByFlightId } = require('../controllers/flightPricingController');

const { protect, authorize } = require("../middleware/auth");

router.route("/search/by-route-date").get(searchFlightsByRouteAndDate);
router.route("/search/by-route").get(searchFlightsByRoute);
router.route("/schedule/generate").get(generateFlightSchedule);

router
  .route("/:id/cancel")
  .patch(protect, authorize("admin", "worker"), cancelFlight);

router.route("/:id/prices").get(getFlightPrices);
router.route("/:id/pricing").get(getFlightPricingByFlightId);
router.route("/:id/crew").get(protect, getFlightCrew);
router
  .route("/")
  .get(getFlights)
  .post(protect, authorize("admin", "worker"), createFlight);

router
  .route("/:id")
  .get(getFlight)
  .put(protect, authorize("admin", "worker"), updateFlight)
  .delete(protect, authorize("admin"), deleteFlight);

router.route("/flight-number/:flightNumber").get(getFlightByNumber);

module.exports = router;
