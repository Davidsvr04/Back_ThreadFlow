class SupplyMovement {
  constructor(data = {}) {
    this.id_supply_movement = data.id_supply_movement;
    this.id_supply = data.id_supply;
    this.movement_date = data.movement_date || new Date();
    this.quantity = data.quantity;
    this.movement_type = data.movement_type;
    this.ref_table = data.ref_table;
    this.ref_id = data.ref_id;
    this.notes = data.notes;
  }

  // Tipos de movimiento válidos
  static MOVEMENT_TYPES = {
    INIT: 'init',
    PURCHASE: 'purchase',
    ISSUE_TO_PRODUCTION: 'issue_to_production',
    RETURN: 'return',
    ADJUSTMENT_POSITIVE: 'adjustment+',
    ADJUSTMENT_NEGATIVE: 'adjustment-'
  };

  // Validar datos del movimiento
  validate() {
    const errors = [];

    if (!this.id_supply) {
      errors.push('ID del insumo es requerido');
    }

    if (!this.quantity || isNaN(this.quantity)) {
      errors.push('La cantidad debe ser un número válido');
    }

    // Permitir cantidades negativas para movimientos que reducen stock
    if (this.quantity !== undefined && this.quantity === 0) {
      errors.push('La cantidad no puede ser cero');
    }

    if (!this.movement_type) {
      errors.push('El tipo de movimiento es requerido');
    }

    if (this.movement_type && !Object.values(SupplyMovement.MOVEMENT_TYPES).includes(this.movement_type)) {
      errors.push('Tipo de movimiento no válido');
    }

    // Validar coherencia entre signo de cantidad y tipo de movimiento
    if (this.quantity && this.movement_type) {
      const isPositiveMovement = this.isPositiveMovement();
      const isPositiveQuantity = this.quantity > 0;
      
      if (isPositiveMovement && !isPositiveQuantity) {
        errors.push(`El tipo de movimiento '${this.movement_type}' requiere cantidad positiva`);
      }
      
      if (!isPositiveMovement && isPositiveQuantity) {
        errors.push(`El tipo de movimiento '${this.movement_type}' requiere cantidad negativa`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Determinar si el movimiento aumenta o disminuye stock
  isPositiveMovement() {
    return [
      SupplyMovement.MOVEMENT_TYPES.INIT,
      SupplyMovement.MOVEMENT_TYPES.PURCHASE,
      SupplyMovement.MOVEMENT_TYPES.RETURN,
      SupplyMovement.MOVEMENT_TYPES.ADJUSTMENT_POSITIVE
    ].includes(this.movement_type);
  }

  // Determinar si el movimiento disminuye stock
  isNegativeMovement() {
    return [
      SupplyMovement.MOVEMENT_TYPES.ISSUE_TO_PRODUCTION,
      SupplyMovement.MOVEMENT_TYPES.ADJUSTMENT_NEGATIVE
    ].includes(this.movement_type);
  }

  // Convertir a objeto para inserción en BD
  toDatabase() {
    return {
      id_supply: this.id_supply,
      movement_date: this.movement_date,
      quantity: this.quantity,
      movement_type: this.movement_type,
      ref_table: this.ref_table,
      ref_id: this.ref_id,
      notes: this.notes
    };
  }

  // Crear desde resultado de BD
  static fromDatabase(row) {
    return new SupplyMovement({
      id_supply_movement: row.id_supply_movement,
      id_supply: row.id_supply,
      movement_date: row.movement_date,
      quantity: parseFloat(row.quantity),
      movement_type: row.movement_type,
      ref_table: row.ref_table,
      ref_id: row.ref_id,
      notes: row.notes
    });
  }
}

module.exports = SupplyMovement;
