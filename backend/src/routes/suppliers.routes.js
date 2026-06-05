const router = require('express').Router();
const ctrl = require('../controllers/supplierController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getSuppliers);
router.post('/', authenticate, ctrl.createSupplier);
router.get('/:id', authenticate, ctrl.getSupplier);
router.put('/:id', authenticate, ctrl.updateSupplier);
router.delete('/:id', authenticate, requireAdmin, ctrl.deleteSupplier);

module.exports = router;
