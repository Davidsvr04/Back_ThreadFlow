# Módulo de Inventario - ThreadFlow

## Descripción
Este módulo maneja toda la gestión de inventario de insumos, incluyendo:
- ✅ Agregar insumos
- ✅ Eliminar insumos  
- ✅ Agregar stock
- ✅ Restar stock
- ✅ Historial de movimientos
- ✅ Reportes de stock bajo

## Endpoints Disponibles

### 🎯 Gestión de Insumos

#### 1. Obtener todos los insumos
```http
GET /api/inventory/supplies
```

**Parámetros de consulta opcionales:**
- `description`: Filtrar por descripción (búsqueda parcial)
- `id_supply_type`: Filtrar por tipo de insumo
- `id_supply_color`: Filtrar por color

**Ejemplo:**
```bash
curl "http://localhost:3000/api/inventory/supplies?description=TELA&id_supply_type=1"
```

#### 2. Crear un nuevo insumo
```http
POST /api/inventory/supplies
```

**Body:**
```json
{
  "description": "TELA NUEVA COLECCIÓN",
  "id_supply_color": 1,
  "id_supply_type": 1,
  "measuring_uom_id": 1
}
```

#### 3. Obtener insumo por ID
```http
GET /api/inventory/supplies/{id}
```

#### 4. Actualizar insumo
```http
PUT /api/inventory/supplies/{id}
```

**Body:**
```json
{
  "description": "TELA ACTUALIZADA",
  "id_supply_color": 2
}
```

#### 5. Eliminar insumo
```http
DELETE /api/inventory/supplies/{id}
```

### 📦 Gestión de Stock

#### 6. Obtener stock actual
```http
GET /api/inventory/supplies/{id}/stock
```

#### 7. Agregar stock
```http
POST /api/inventory/supplies/{id}/stock/add
```

**Body:**
```json
{
  "quantity": 50.5,
  "notes": "Compra proveedor ABC"
}
```

#### 8. Restar stock
```http
POST /api/inventory/supplies/{id}/stock/subtract
```

**Body:**
```json
{
  "quantity": 10.25,
  "notes": "Uso en producción pedido #123"
}
```

### 📊 Reportes y Consultas

#### 9. Historial de movimientos
```http
GET /api/inventory/supplies/{id}/movements?limit=20&offset=0
```

#### 10. Insumos con stock bajo
```http
GET /api/inventory/reports/low-stock?threshold=10
```

## Ejemplos de Uso

### Ejemplo 1: Crear un insumo y agregar stock inicial
```bash
# 1. Crear insumo
curl -X POST http://localhost:3000/api/inventory/supplies \
  -H "Content-Type: application/json" \
  -d '{
    "description": "TELA ALGODÓN AZUL",
    "id_supply_color": 7,
    "id_supply_type": 1,
    "measuring_uom_id": 1
  }'

# 2. Agregar stock inicial (asumiendo que el ID del insumo creado es 61)
curl -X POST http://localhost:3000/api/inventory/supplies/61/stock/add \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 100,
    "notes": "Stock inicial"
  }'
```

### Ejemplo 2: Usar insumo en producción
```bash
# Restar stock para producción
curl -X POST http://localhost:3000/api/inventory/supplies/61/stock/subtract \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 15.5,
    "notes": "Usado en pedido #456 - 10 camisas talla M"
  }'
```

### Ejemplo 3: Consultar stock actual y historial
```bash
# Ver stock actual
curl http://localhost:3000/api/inventory/supplies/61/stock

# Ver historial de movimientos
curl http://localhost:3000/api/inventory/supplies/61/movements
```

### Ejemplo 4: Buscar insumos con filtros
```bash
# Buscar todas las telas
curl "http://localhost:3000/api/inventory/supplies?description=TELA"

# Buscar por tipo específico
curl "http://localhost:3000/api/inventory/supplies?id_supply_type=1"

# Buscar insumos con stock bajo
curl "http://localhost:3000/api/inventory/reports/low-stock?threshold=20"
```

## Respuestas de la API

### Respuesta Exitosa (Ejemplo con insumo)
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "id_supply": 335,
    "description": "BANDERA BATA",
    "active": true,
    "id_supply_color": 19,
    "id_supply_type": 3,
    "measuring_uom_id": 2,
    "color_name": "LILA",
    "type_name": "BANDERA",
    "category_name": "BANDERA",
    "uom_description": "Unidades",
    "stock_actual": 2
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": ["Lista de errores específicos"]
}
```

## Validaciones Implementadas

- ✅ Descripción obligatoria (máx. 200 caracteres)
- ✅ Cantidad debe ser positiva y numérica
- ✅ No permitir stock negativo
- ✅ IDs deben ser enteros positivos
- ✅ Verificación de existencia antes de operaciones
- ✅ No eliminar insumos con stock existente

## Funcionalidades del Trigger

El sistema incluye un trigger en PostgreSQL que:
- ✅ Actualiza automáticamente la tabla `supply_stock`
- ✅ Previene stock negativo
- ✅ Mantiene la integridad referencial
- ✅ Maneja INSERT, UPDATE y DELETE en `supply_movement`
