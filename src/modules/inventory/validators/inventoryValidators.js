/**
 * Validador para creación de insumos
 */
const validateCreateSupply = (req, res, next) => {
  const { description, id_supply_color, id_supply_type, measuring_uom_id } = req.body;
  const errors = [];

  // Validar descripción
  if (!description || description.trim() === '') {
    errors.push('La descripción es requerida');
  } else if (description.length > 200) {
    errors.push('La descripción no puede exceder 200 caracteres');
  }

  // Validar IDs opcionales
  if (id_supply_color && (!Number.isInteger(id_supply_color) || id_supply_color <= 0)) {
    errors.push('El ID del color debe ser un número entero positivo');
  }

  if (id_supply_type && (!Number.isInteger(id_supply_type) || id_supply_type <= 0)) {
    errors.push('El ID del tipo debe ser un número entero positivo');
  }

  if (measuring_uom_id && (!Number.isInteger(measuring_uom_id) || measuring_uom_id <= 0)) {
    errors.push('El ID de la unidad de medida debe ser un número entero positivo');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors
    });
  }

  next();
};

/**
 * Validador para actualización de insumos
 */
const validateUpdateSupply = (req, res, next) => {
  const { description, id_supply_color, id_supply_type, measuring_uom_id, active } = req.body;
  const errors = [];

  // Validar que al menos un campo esté presente
  if (!description && id_supply_color === undefined && id_supply_type === undefined && 
      measuring_uom_id === undefined && active === undefined) {
    errors.push('Debe proporcionar al menos un campo para actualizar');
  }

  // Validar descripción si está presente
  if (description !== undefined) {
    if (!description || description.trim() === '') {
      errors.push('La descripción no puede estar vacía');
    } else if (description.length > 200) {
      errors.push('La descripción no puede exceder 200 caracteres');
    }
  }

  // Validar IDs opcionales si están presentes
  if (id_supply_color !== undefined && (!Number.isInteger(id_supply_color) || id_supply_color <= 0)) {
    errors.push('El ID del color debe ser un número entero positivo');
  }

  if (id_supply_type !== undefined && (!Number.isInteger(id_supply_type) || id_supply_type <= 0)) {
    errors.push('El ID del tipo debe ser un número entero positivo');
  }

  if (measuring_uom_id !== undefined && (!Number.isInteger(measuring_uom_id) || measuring_uom_id <= 0)) {
    errors.push('El ID de la unidad de medida debe ser un número entero positivo');
  }

  // Validar active si está presente
  if (active !== undefined && typeof active !== 'boolean') {
    errors.push('El campo active debe ser un valor booleano');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors
    });
  }

  next();
};

/**
 * Validador para movimientos de stock
 */
const validateStockMovement = (req, res, next) => {
  const { quantity, notes } = req.body;
  const errors = [];

  // Validar cantidad
  if (!quantity) {
    errors.push('La cantidad es requerida');
  } else if (isNaN(quantity)) {
    errors.push('La cantidad debe ser un número válido');
  } else if (parseFloat(quantity) <= 0) {
    errors.push('La cantidad debe ser mayor a 0');
  } else if (parseFloat(quantity) > 999999.9999) {
    errors.push('La cantidad no puede exceder 999999.9999');
  }

  // Validar notas (opcional)
  if (notes && typeof notes !== 'string') {
    errors.push('Las notas deben ser texto');
  } else if (notes && notes.length > 1000) {
    errors.push('Las notas no pueden exceder 1000 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors
    });
  }

  // Convertir quantity a número
  req.body.quantity = parseFloat(quantity);
  
  next();
};

/**
 * Validador para parámetros de ID
 */
const validateIdParam = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(id) || parseInt(id) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID inválido. Debe ser un número entero positivo'
    });
  }

  // Convertir a número
  req.params.id = parseInt(id);
  
  next();
};

/**
 * Validador para parámetros de consulta de paginación
 */
const validatePaginationQuery = (req, res, next) => {
  const { limit, offset } = req.query;
  const errors = [];

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 1000) {
      errors.push('Limit debe ser un número entre 1 y 1000');
    }
  }

  if (offset !== undefined) {
    const offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      errors.push('Offset debe ser un número mayor o igual a 0');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Parámetros de consulta inválidos',
      errors
    });
  }

  next();
};

/**
 * Validador para filtros de búsqueda
 */
const validateSearchFilters = (req, res, next) => {
  const { id_supply_type, id_supply_color, threshold } = req.query;
  const errors = [];

  if (id_supply_type !== undefined) {
    const typeId = parseInt(id_supply_type);
    if (isNaN(typeId) || typeId <= 0) {
      errors.push('id_supply_type debe ser un número entero positivo');
    }
  }

  if (id_supply_color !== undefined) {
    const colorId = parseInt(id_supply_color);
    if (isNaN(colorId) || colorId <= 0) {
      errors.push('id_supply_color debe ser un número entero positivo');
    }
  }

  if (threshold !== undefined) {
    const thresholdNum = parseInt(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      errors.push('threshold debe ser un número mayor o igual a 0');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Filtros de búsqueda inválidos',
      errors
    });
  }

  next();
};

module.exports = {
  validateCreateSupply,
  validateUpdateSupply,
  validateStockMovement,
  validateIdParam,
  validatePaginationQuery,
  validateSearchFilters
};
