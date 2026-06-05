const router = require('express').Router();
const ctrl = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAlerts);
router.get('/summary', authenticate, ctrl.getAlertSummary);
router.patch('/read-all', authenticate, ctrl.markAllRead);
router.patch('/:id/read', authenticate, ctrl.markAsRead);
router.patch('/:id/dismiss', authenticate, ctrl.dismissAlert);

module.exports = router;
