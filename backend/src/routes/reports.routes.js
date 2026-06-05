const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.get('/movements', authenticate, ctrl.getStockMovementReport);
router.get('/forecast', authenticate, ctrl.getForecastReport);
router.get('/inventory-value', authenticate, ctrl.getInventoryValueReport);
router.get('/top-movers', authenticate, ctrl.getTopMovingProducts);

module.exports = router;
