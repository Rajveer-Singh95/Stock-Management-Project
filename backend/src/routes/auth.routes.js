const router = require('express').Router();
const { register, login, getProfile, getUsers } = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.get('/users', authenticate, requireAdmin, getUsers);

module.exports = router;
