const express = require('express');
const router = express.Router();

// Importar rutas del módulo de inventario
const inventoryRoutes = require('./inventoryRoutes');

// Usar las rutas de inventario
router.use('/', inventoryRoutes);

module.exports = router;
