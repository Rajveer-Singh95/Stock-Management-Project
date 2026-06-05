const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getOrders);
router.post('/', authenticate, ctrl.createOrder);
router.get('/:id', authenticate, ctrl.getOrder);
router.patch('/:id/status', authenticate, ctrl.updateOrderStatus);
router.delete('/:id', authenticate, ctrl.deleteOrder);

module.exports = router;
