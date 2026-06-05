const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/categories', authenticate, ctrl.getCategories);
router.post('/categories', authenticate, requireAdmin, ctrl.createCategory);

router.get('/', authenticate, ctrl.getProducts);
router.post('/', authenticate, ctrl.createProduct);
router.get('/:id', authenticate, ctrl.getProduct);
router.put('/:id', authenticate, ctrl.updateProduct);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteProduct);
router.post('/:id/adjust', authenticate, ctrl.adjustStock);
router.get('/:id/movements', authenticate, ctrl.getStockMovements);

module.exports = router;
