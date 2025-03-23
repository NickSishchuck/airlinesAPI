const express = require('express');
const router = express.Router();
const {
  registerEmail,
  login,
  getMe,
  updatePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/registerEmail', registerEmail);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.get('/logout', protect, logout);

module.exports = router;

