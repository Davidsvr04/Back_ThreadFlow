const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventoryController');
const {
  validateCreateSupply,
  validateUpdateSupply,
  validateStockMovement,
  validateIdParam,
  validatePaginationQuery,
  validateSearchFilters
} = require('../validators/inventoryValidators');

// ========== RUTAS DE INSUMOS ==========

/**
 * @route   GET /api/inventory/supplies
 * @desc    Obtener todos los insumos con filtros opcionales
 * @access  Public
 * @query   description, id_supply_type, id_supply_color
 */
router.get('/supplies', validateSearchFilters, inventoryController.getAllSupplies);

/**
 * @route   POST /api/inventory/supplies
 * @desc    Crear un nuevo insumo
 * @access  Public
 * @body    description, id_supply_color, id_supply_type, measuring_uom_id
 */
router.post('/supplies', validateCreateSupply, inventoryController.createSupply);

/**
 * @route   GET /api/inventory/supplies/:id
 * @desc    Obtener un insumo por ID
 * @access  Public
 * @param   id - ID del insumo
 */
router.get('/supplies/:id', validateIdParam, inventoryController.getSupplyById);

/**
 * @route   PUT /api/inventory/supplies/:id
 * @desc    Actualizar un insumo
 * @access  Public
 * @param   id - ID del insumo
 * @body    description, id_supply_color, id_supply_type, measuring_uom_id, active
 */
router.put('/supplies/:id', validateIdParam, validateUpdateSupply, inventoryController.updateSupply);

/**
 * @route   DELETE /api/inventory/supplies/:id
 * @desc    Eliminar un insumo (soft delete)
 * @access  Public
 * @param   id - ID del insumo
 */
router.delete('/supplies/:id', validateIdParam, inventoryController.deleteSupply);

// ========== RUTAS DE STOCK ==========

/**
 * @route   GET /api/inventory/supplies/:id/stock
 * @desc    Obtener stock actual de un insumo
 * @access  Public
 * @param   id - ID del insumo
 */
router.get('/supplies/:id/stock', validateIdParam, inventoryController.getStock);

/**
 * @route   POST /api/inventory/supplies/:id/stock/add
 * @desc    Agregar stock a un insumo
 * @access  Public
 * @param   id - ID del insumo
 * @body    quantity, notes
 */
router.post('/supplies/:id/stock/add', validateIdParam, validateStockMovement, inventoryController.addStock
);

/**
 * @route   POST /api/inventory/supplies/:id/stock/subtract
 * @desc    Restar stock de un insumo
 * @access  Public
 * @param   id - ID del insumo
 * @body    quantity, notes
 */
router.post('/supplies/:id/stock/subtract', validateIdParam, validateStockMovement, inventoryController.subtractStock
);

// ========== RUTAS DE MOVIMIENTOS ==========

/**
 * @route   GET /api/inventory/supplies/:id/movements
 * @desc    Obtener historial de movimientos de un insumo
 * @access  Public
 * @param   id - ID del insumo
 * @query   limit, offset
 */
router.get('/supplies/:id/movements', validateIdParam, validatePaginationQuery, inventoryController.getMovementHistory
);

// ========== RUTAS DE REPORTES ==========

/**
 * @route   GET /api/inventory/reports/low-stock
 * @desc    Obtener insumos con stock bajo
 * @access  Public
 * @query   threshold (default: 10)
 */
router.get('/reports/low-stock', validateSearchFilters, inventoryController.getLowStockSupplies);

module.exports = router;
