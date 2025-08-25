const inventoryService = require('../services/inventoryService');

class InventoryController {
  
  //Crear un nuevo insumo
  async createSupply(req, res) {
    try {
      const supply = await inventoryService.createSupply(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Insumo creado exitosamente',
        data: supply
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  //Obtener todos los insumos
  async getAllSupplies(req, res) {
    try {
      const filters = {
        description: req.query.description,
        id_supply_type: req.query.id_supply_type ? parseInt(req.query.id_supply_type) : undefined,
        id_supply_color: req.query.id_supply_color ? parseInt(req.query.id_supply_color) : undefined
      };

      const supplies = await inventoryService.getAllSupplies(filters);
      
      res.json({
        success: true,
        message: 'Insumos obtenidos exitosamente',
        data: supplies,
        count: supplies.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  //Obtener un insumo por ID
  async getSupplyById(req, res) {
    try {
      const { id } = req.params;
      const supply = await inventoryService.getSupplyById(parseInt(id));
      
      res.json({
        success: true,
        message: 'Insumo obtenido exitosamente',
        data: supply
      });
    } catch (error) {
      const statusCode = error.message === 'Insumo no encontrado' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  //Actualizar un insumo
  async updateSupply(req, res) {
    try {
      const { id } = req.params;
      const supply = await inventoryService.updateSupply(parseInt(id), req.body);
      
      res.json({
        success: true,
        message: 'Insumo actualizado exitosamente',
        data: supply
      });
    } catch (error) {
      const statusCode = error.message === 'Insumo no encontrado' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  //Eliminar un insumo
  async deleteSupply(req, res) {
    try {
      const { id } = req.params;
      await inventoryService.deleteSupply(parseInt(id));
      
      res.json({
        success: true,
        message: 'Insumo eliminado exitosamente'
      });
    } catch (error) {
      const statusCode = error.message === 'Insumo no encontrado' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // ========== GESTIÓN DE STOCK ==========

  //Obtener stock de un insumo
  async getStock(req, res) {
    try {
      const { id } = req.params;
      const stock = await inventoryService.getStockBySupply(parseInt(id));
      
      res.json({
        success: true,
        message: 'Stock obtenido exitosamente',
        data: stock
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  //Agregar stock a un insumo
  async addStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, notes } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        });
      }

      const result = await inventoryService.addStock(parseInt(id), parseFloat(quantity), notes);
      
      res.json({
        success: true,
        message: 'Stock agregado exitosamente',
        data: result
      });
    } catch (error) {
      const statusCode = error.message === 'Insumo no encontrado' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  //Restar stock de un insumo
  async subtractStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, notes } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        });
      }

      const result = await inventoryService.subtractStock(parseInt(id), parseFloat(quantity), notes);
      
      res.json({
        success: true,
        message: 'Stock reducido exitosamente',
        data: result
      });
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 
                         error.message.includes('insuficiente') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // ========== REPORTES Y CONSULTAS ==========

  // Obtener historial de movimientos
  async getMovementHistory(req, res) {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;

      const options = {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      };

      const movements = await inventoryService.getMovementHistory(parseInt(id), options);
      
      res.json({
        success: true,
        message: 'Historial obtenido exitosamente',
        data: movements,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          count: movements.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Obtener insumos con stock bajo
  async getLowStockSupplies(req, res) {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;
      const supplies = await inventoryService.getLowStockSupplies(threshold);
      
      res.json({
        success: true,
        message: 'Insumos con stock bajo obtenidos exitosamente',
        data: supplies,
        count: supplies.length,
        threshold
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = new InventoryController();
