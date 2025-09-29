const express = require('express');
const router = express.Router();
const {
  getCrews,
  getCrew,
  createCrew,
  updateCrew,
  deleteCrew,
  getCrewMembers,
  assignCrewMember,
  removeCrewMember,
  getCrewAircraft,
  validateCrew
} = require('../controllers/crewController');

const { protect, authorize } = require('../middleware/auth');

router.route('/:id/validate')
  .get(protect, authorize('admin', 'worker'), validateCrew);

router.route('/:id/members')
  .get(protect, authorize('admin', 'worker'), getCrewMembers)
  .post(protect, authorize('admin'), assignCrewMember);

router.route('/:id/members/:memberId')
  .delete(protect, authorize('admin'), removeCrewMember);

router.route('/:id/aircraft')
  .get(protect, authorize('admin', 'worker'), getCrewAircraft);

router.route('/')
  .get(protect, authorize('admin', 'worker'), getCrews)
  .post(protect, authorize('admin'), createCrew);

router.route('/:id')
  .get(protect, authorize('admin', 'worker'), getCrew)
  .put(protect, authorize('admin'), updateCrew)
  .delete(protect, authorize('admin'), deleteCrew);

module.exports = router;
