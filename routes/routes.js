const express = require('express');
const router = express.Router();
const {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteFlights
} = require('../controllers/routeController');

const { protect, authorize } = require('../middleware/auth');

router.route('/:id/flights')
  .get(getRouteFlights);

router.route('/')
  .get(getRoutes)
  .post(protect, authorize('admin'), createRoute);

router.route('/:id')
  .get(getRoute)
  .put(protect, authorize('admin'), updateRoute)
  .delete(protect, authorize('admin'), deleteRoute);

module.exports = router;
