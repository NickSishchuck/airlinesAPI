const express = require('express');
const router = express.Router();
const {
  getCrewMembers,
  getCrewMember,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember,
  getCrewMemberAssignments,
  getCrewMemberFlights,
  searchCrewMembersByLastName
} = require('../controllers/crewMemberController');

const { protect, authorize } = require('../middleware/auth');

// Crew member assignments and flights
router.route('/:id/assignments')
  .get(protect, authorize('admin', 'worker'), getCrewMemberAssignments);

router.route('/:id/flights')
  .get(protect, authorize('admin', 'worker'), getCrewMemberFlights);

// Main resource routes
router.route('/')
  .get(protect, authorize('admin', 'worker'), getCrewMembers)
  .post(protect, authorize('admin'), createCrewMember);

router.route('/:id')
  .get(protect, authorize('admin', 'worker'), getCrewMember)
  .put(protect, authorize('admin'), updateCrewMember)
  .delete(protect, authorize('admin'), deleteCrewMember);

router.route('/search/:lastName')
  .get(protect, authorize('admin', 'worker'), searchCrewMembersByLastName);

module.exports = router;