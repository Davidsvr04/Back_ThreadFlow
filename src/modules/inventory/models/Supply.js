class Supply {
  constructor(data = {}) {
    this.id_supply = data.id_supply;
    this.description = data.description;
    this.active = data.active !== undefined ? data.active : true;
    this.id_supply_color = data.id_supply_color;
    this.id_supply_type = data.id_supply_type;
    this.measuring_uom_id = data.measuring_uom_id;
  }

  // Validar datos del insumo
  validate() {
    const errors = [];

    if (!this.description || this.description.trim() === '') {
      errors.push('La descripción es requerida');
    }

    if (this.description && this.description.length > 200) {
      errors.push('La descripción no puede exceder 200 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convertir a objeto para inserción en BD
  toDatabase() {
    const data = {
      description: this.description,
      active: this.active
    };

    if (this.id_supply_color) data.id_supply_color = this.id_supply_color;
    if (this.id_supply_type) data.id_supply_type = this.id_supply_type;
    if (this.measuring_uom_id) data.measuring_uom_id = this.measuring_uom_id;

    return data;
  }

  // Crear desde resultado de BD
  static fromDatabase(row) {
    return new Supply({
      id_supply: row.id_supply,
      description: row.description,
      active: row.active,
      id_supply_color: row.id_supply_color,
      id_supply_type: row.id_supply_type,
      measuring_uom_id: row.measuring_uom_id
    });
  }
}

module.exports = Supply;
