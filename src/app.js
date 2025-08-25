const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { config, validateConfig } = require('./config');
const { testConnection } = require('./database/connection');

// Crear aplicación Express
const app = express();

// Validar configuración al inicio
try {
  validateConfig();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// Middlewares de seguridad y logging
app.use(helmet());
app.use(morgan('combined'));

// Configurar CORS
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true
}));

// Middlewares para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ThreadFlow Backend está funcionando',
    timestamp: new Date().toISOString(),
    environment: config.server.env
  });
});

// Ruta para probar conexión a BD
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

// Rutas principales (se agregarán después)
app.use('/api/v1', (req, res) => {
  res.json({
    message: 'API ThreadFlow v1.0',
    endpoints: {
      inventory: '/api/v1/inventory',
      quotations: '/api/v1/quotations',
      manufacturers: '/api/v1/manufacturers'
    }
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'ERROR',
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    status: 'ERROR',
    message: err.message || 'Error interno del servidor',
    ...(config.server.env === 'development' && { stack: err.stack })
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(config.server.port, () => {
      console.log('🚀 Servidor iniciado exitosamente');
      console.log(`📡 Puerto: ${config.server.port}`);
      console.log(`🌍 Entorno: ${config.server.env}`);
      console.log(`🔗 Health check: http://localhost:${config.server.port}/health`);
      console.log(`📊 DB Status: http://localhost:${config.server.port}/db-status`);
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Cerrando servidor...');
  process.exit(0);
});

module.exports = { app, startServer };
