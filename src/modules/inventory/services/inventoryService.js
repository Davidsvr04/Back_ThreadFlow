const { query } = require('../../../database/connection');
const Supply = require('../models/Supply');
const SupplyMovement = require('../models/SupplyMovement');
const SupplyStock = require('../models/SupplyStock');

class InventoryService {
  
  // ========== GESTIÓN DE INSUMOS ==========
  
  /**
   * Crear un nuevo insumo
   * @param {Object} supplyData - Datos del insumo
   * @returns {Object} Insumo creado
   */
  async createSupply(supplyData) {
    try {
      const supply = new Supply(supplyData);
      const validation = supply.validate();
      
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      const data = supply.toDatabase();
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO supply (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await query(insertQuery, values);
      
      if (result.rows.length > 0) {
        // Crear registro inicial de stock en 0
        await this.initializeStock(result.rows[0].id_supply);
        return Supply.fromDatabase(result.rows[0]);
      }
      
      throw new Error('No se pudo crear el insumo');
    } catch (error) {
      console.error('Error creando insumo:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los insumos activos
   * @param {Object} filters - Filtros opcionales
   * @returns {Array} Lista de insumos
   */
  async getAllSupplies(filters = {}) {
    try {
      let whereConditions = ['s.active = true'];
      let queryParams = [];
      let paramIndex = 1;

      // Filtro por descripción
      if (filters.description) {
        whereConditions.push(`s.description ILIKE $${paramIndex}`);
        queryParams.push(`%${filters.description}%`);
        paramIndex++;
      }

      // Filtro por tipo
      if (filters.id_supply_type) {
        whereConditions.push(`s.id_supply_type = $${paramIndex}`);
        queryParams.push(filters.id_supply_type);
        paramIndex++;
      }

      // Filtro por color
      if (filters.id_supply_color) {
        whereConditions.push(`s.id_supply_color = $${paramIndex}`);
        queryParams.push(filters.id_supply_color);
        paramIndex++;
      }

      const selectQuery = `
        SELECT 
          s.*,
          sc.name as color_name,
          st.name as type_name,
          scat.name as category_name,
          uom.description as uom_description,
          ss.stock_actual
        FROM supply s
        LEFT JOIN supply_color sc ON s.id_supply_color = sc.id_supply_color
        LEFT JOIN supply_type st ON s.id_supply_type = st.id_supply_type
        LEFT JOIN supply_category scat ON st.id_supply_category = scat.id_supply_category
        LEFT JOIN unit_of_measure uom ON s.measuring_uom_id = uom.id_uom
        LEFT JOIN supply_stock ss ON s.id_supply = ss.id_supply
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY s.description
      `;

      const result = await query(selectQuery, queryParams);
      return result.rows.map(row => ({
        ...Supply.fromDatabase(row),
        color_name: row.color_name,
        type_name: row.type_name,
        category_name: row.category_name,
        uom_description: row.uom_description,
        stock_actual: parseFloat(row.stock_actual) || 0
      }));
    } catch (error) {
      console.error('Error obteniendo insumos:', error);
      throw error;
    }
  }

  /**
   * Obtener un insumo por ID
   * @param {number} id_supply - ID del insumo
   * @returns {Object} Insumo encontrado
   */
  async getSupplyById(id_supply) {
    try {
      const selectQuery = `
        SELECT 
          s.*,
          sc.name as color_name,
          st.name as type_name,
          scat.name as category_name,
          uom.description as uom_description,
          ss.stock_actual
        FROM supply s
        LEFT JOIN supply_color sc ON s.id_supply_color = sc.id_supply_color
        LEFT JOIN supply_type st ON s.id_supply_type = st.id_supply_type
        LEFT JOIN supply_category scat ON st.id_supply_category = scat.id_supply_category
        LEFT JOIN unit_of_measure uom ON s.measuring_uom_id = uom.id_uom
        LEFT JOIN supply_stock ss ON s.id_supply = ss.id_supply
        WHERE s.id_supply = $1 AND s.active = true
      `;

      const result = await query(selectQuery, [id_supply]);
      
      if (result.rows.length === 0) {
        throw new Error('Insumo no encontrado');
      }

      const row = result.rows[0];
      return {
        ...Supply.fromDatabase(row),
        color_name: row.color_name,
        type_name: row.type_name,
        category_name: row.category_name,
        uom_description: row.uom_description,
        stock_actual: parseFloat(row.stock_actual) || 0
      };
    } catch (error) {
      console.error('Error obteniendo insumo:', error);
      throw error;
    }
  }

  /**
   * Actualizar un insumo
   * @param {number} id_supply - ID del insumo
   * @param {Object} updateData - Datos a actualizar
   * @returns {Object} Insumo actualizado
   */
  async updateSupply(id_supply, updateData) {
    try {
      // Verificar que existe
      await this.getSupplyById(id_supply);

      const supply = new Supply(updateData);
      const validation = supply.validate();
      
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      const data = supply.toDatabase();
      const keys = Object.keys(data);
      const values = Object.values(data);
      
      const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');

      const updateQuery = `
        UPDATE supply 
        SET ${setClause}
        WHERE id_supply = $1 AND active = true
        RETURNING *
      `;

      const result = await query(updateQuery, [id_supply, ...values]);
      
      if (result.rows.length === 0) {
        throw new Error('No se pudo actualizar el insumo');
      }

      return Supply.fromDatabase(result.rows[0]);
    } catch (error) {
      console.error('Error actualizando insumo:', error);
      throw error;
    }
  }

  /**
   * Eliminar un insumo (soft delete)
   * @param {number} id_supply - ID del insumo
   * @returns {boolean} Éxito de la operación
   */
  async deleteSupply(id_supply) {
    try {
      // Verificar que existe
      await this.getSupplyById(id_supply);

      // Verificar que no tiene stock
      const stock = await this.getStockBySupply(id_supply);
      if (stock.stock_actual > 0) {
        throw new Error('No se puede eliminar un insumo con stock existente');
      }

      const deleteQuery = `
        UPDATE supply 
        SET active = false 
        WHERE id_supply = $1
        RETURNING id_supply
      `;

      const result = await query(deleteQuery, [id_supply]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error eliminando insumo:', error);
      throw error;
    }
  }

  // ========== GESTIÓN DE STOCK ==========

  /**
   * Inicializar stock de un insumo
   * @param {number} id_supply - ID del insumo
   * @returns {Object} Stock inicializado
   */
  async initializeStock(id_supply) {
    try {
      const insertQuery = `
        INSERT INTO supply_stock (id_supply, stock_actual)
        VALUES ($1, 0)
        ON CONFLICT (id_supply) DO NOTHING
        RETURNING *
      `;

      const result = await query(insertQuery, [id_supply]);
      return result.rows[0] ? SupplyStock.fromDatabase(result.rows[0]) : null;
    } catch (error) {
      console.error('Error inicializando stock:', error);
      throw error;
    }
  }

  /**
   * Obtener stock actual de un insumo
   * @param {number} id_supply - ID del insumo
   * @returns {Object} Stock actual
   */
  async getStockBySupply(id_supply) {
    try {
      const selectQuery = `
        SELECT * FROM supply_stock 
        WHERE id_supply = $1
      `;

      const result = await query(selectQuery, [id_supply]);
      
      if (result.rows.length === 0) {
        // Si no existe, lo inicializamos
        return await this.initializeStock(id_supply);
      }

      return SupplyStock.fromDatabase(result.rows[0]);
    } catch (error) {
      console.error('Error obteniendo stock:', error);
      throw error;
    }
  }

  /**
   * Agregar stock a un insumo
   * @param {number} id_supply - ID del insumo
   * @param {number} quantity - Cantidad a agregar
   * @param {string} notes - Notas del movimiento
   * @returns {Object} Resultado del movimiento
   */
  async addStock(id_supply, quantity, notes = '') {
    try {
      // Verificar que el insumo existe
      await this.getSupplyById(id_supply);

      const movement = new SupplyMovement({
        id_supply,
        quantity: Math.abs(quantity), // Asegurar que sea positivo
        movement_type: SupplyMovement.MOVEMENT_TYPES.PURCHASE,
        notes
      });

      const validation = movement.validate();
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      return await this.createMovement(movement);
    } catch (error) {
      console.error('Error agregando stock:', error);
      throw error;
    }
  }

  /**
   * Restar stock de un insumo
   * @param {number} id_supply - ID del insumo
   * @param {number} quantity - Cantidad a restar
   * @param {string} notes - Notas del movimiento
   * @returns {Object} Resultado del movimiento
   */
  async subtractStock(id_supply, quantity, notes = '') {
    try {
      // Verificar que el insumo existe
      await this.getSupplyById(id_supply);

      // Verificar stock disponible
      const currentStock = await this.getStockBySupply(id_supply);
      if (!currentStock.hasEnoughStock(quantity)) {
        throw new Error(`Stock insuficiente. Disponible: ${currentStock.stock_actual}, Requerido: ${quantity}`);
      }

      const movement = new SupplyMovement({
        id_supply,
        quantity: -Math.abs(quantity), // CANTIDAD NEGATIVA para movimientos que restan
        movement_type: SupplyMovement.MOVEMENT_TYPES.ISSUE_TO_PRODUCTION,
        notes
      });

      const validation = movement.validate();
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      return await this.createMovement(movement);
    } catch (error) {
      console.error('Error restando stock:', error);
      throw error;
    }
  }

  // ========== GESTIÓN DE MOVIMIENTOS ==========

  /**
   * Crear un movimiento de inventario
   * @param {SupplyMovement} movement - Movimiento a crear
   * @returns {Object} Movimiento creado y stock actualizado
   */
  async createMovement(movement) {
    try {
      const data = movement.toDatabase();
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

      const insertQuery = `
        INSERT INTO supply_movement (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await query(insertQuery, values);
      
      if (result.rows.length === 0) {
        throw new Error('No se pudo crear el movimiento');
      }

      const createdMovement = SupplyMovement.fromDatabase(result.rows[0]);
      const updatedStock = await this.getStockBySupply(movement.id_supply);

      return {
        movement: createdMovement,
        stock: updatedStock
      };
    } catch (error) {
      console.error('Error creando movimiento:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de movimientos de un insumo
   * @param {number} id_supply - ID del insumo
   * @param {Object} options - Opciones de paginación
   * @returns {Array} Lista de movimientos
   */
  async getMovementHistory(id_supply, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const selectQuery = `
        SELECT 
          sm.*,
          s.description as supply_description
        FROM supply_movement sm
        JOIN supply s ON sm.id_supply = s.id_supply
        WHERE sm.id_supply = $1
        ORDER BY sm.movement_date DESC, sm.id_supply_movement DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await query(selectQuery, [id_supply, limit, offset]);
      
      return result.rows.map(row => ({
        ...SupplyMovement.fromDatabase(row),
        supply_description: row.supply_description
      }));
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  }

  /**
   * Obtener insumos con stock bajo
   * @param {number} threshold - Umbral de stock bajo
   * @returns {Array} Lista de insumos con stock bajo
   */
  async getLowStockSupplies(threshold = 10) {
    try {
      const selectQuery = `
        SELECT 
          s.*,
          sc.name as color_name,
          st.name as type_name,
          scat.name as category_name,
          uom.description as uom_description,
          ss.stock_actual
        FROM supply s
        LEFT JOIN supply_color sc ON s.id_supply_color = sc.id_supply_color
        LEFT JOIN supply_type st ON s.id_supply_type = st.id_supply_type
        LEFT JOIN supply_category scat ON st.id_supply_category = scat.id_supply_category
        LEFT JOIN unit_of_measure uom ON s.measuring_uom_id = uom.id_uom
        JOIN supply_stock ss ON s.id_supply = ss.id_supply
        WHERE s.active = true 
          AND ss.stock_actual <= $1
        ORDER BY ss.stock_actual ASC, s.description
      `;

      const result = await query(selectQuery, [threshold]);
      
      return result.rows.map(row => ({
        ...Supply.fromDatabase(row),
        color_name: row.color_name,
        type_name: row.type_name,
        category_name: row.category_name,
        uom_description: row.uom_description,
        stock_actual: parseFloat(row.stock_actual)
      }));
    } catch (error) {
      console.error('Error obteniendo stock bajo:', error);
      throw error;
    }
  }
}

module.exports = new InventoryService();
