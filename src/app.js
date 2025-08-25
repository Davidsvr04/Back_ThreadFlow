const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { config, validateConfig } = require('./config');
const { testConnection } = require('./database/connection');
// Importar rutas de módulos
const inventoryRoutes = require('./modules/inventory/routes');

// Validar configuración al inicio
try {
  validateConfig();
} catch (error) {
  console.error('Error de configuración:', error.message);
  process.exit(1);
}

// Configurar proxy para Azure Web Apps o servidores proxy
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
}));

// Middlewares de seguridad y logging
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ========== RUTAS DE SISTEMA ==========
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ThreadFlow Backend está funcionando',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
    version: '1.0.0'
  });
});
// Estado de la base de datos
app.get('/db-status', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.status(200).json({
      status: isConnected ? 'OK' : 'ERROR',
      database: 'PostgreSQL',
      connected: isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al conectar con la base de datos',
      error: error.message
    });
  }
});

// ========== RUTAS DE LA API ==========
// Módulo de inventario
app.use('/api/inventory', inventoryRoutes);

// ========== MIDDLEWARE DE MANEJO DE ERRORES ==========

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'ERROR',
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    availableEndpoints: [
      '/health',
      '/db-status',
      '/api/v1',
      '/api/v1/inventory'
    ]
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Determinar el código de estado
  const statusCode = err.status || err.statusCode || 500;
  
  // Respuesta base
  const errorResponse = {
    status: 'ERROR',
    message: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString()
  };

  // Agregar stack trace solo en desarrollo
  if (config.server.env === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
});

module.exports = app;
