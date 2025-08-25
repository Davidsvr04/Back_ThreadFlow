const app = require('./src/app');
const { config } = require('./src/config');
const { testConnection, closePool } = require('./src/database/connection');

/**
 * Función para iniciar el servidor
 */
const startServer = async () => {
  try {
    console.log('🚀 Iniciando ThreadFlow Backend...');
    
    // Probar conexión a la base de datos
    console.log('🔌 Probando conexión a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    console.log('✅ Conexión a la base de datos exitosa');

    // Iniciar servidor HTTP
    const server = app.listen(config.server.port, () => {
      console.log('');
      console.log('🎉 ¡Servidor ThreadFlow iniciado exitosamente!');
      console.log('==========================================');
      console.log(`📡 Puerto: ${config.server.port}`);
      console.log(`🌍 Entorno: ${config.server.env}`);
      console.log(`📊 Base de datos: ${config.database.name}`);
      console.log('');
      console.log('🔗 Endpoints disponibles:');
      console.log(`   Health check: http://localhost:${config.server.port}/health`);
      console.log(`   DB Status: http://localhost:${config.server.port}/db-status`);
      console.log(`   API Info: http://localhost:${config.server.port}/api/v1`);
      console.log(`   Inventario: http://localhost:${config.server.port}/api/v1/inventory`);
      console.log('==========================================');
    });

    // Configurar timeout del servidor
    server.timeout = 120000; // 2 minutos

    return server;

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

/**
 * Función para cerrar el servidor de forma segura
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor de forma segura...`);
  
  try {
    // Cerrar pool de conexiones de la base de datos
    await closePool();
    console.log('✅ Pool de conexiones cerrado');
    
    console.log('👋 Servidor cerrado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el cierre:', error);
    process.exit(1);
  }
};

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada en:', promise, 'razón:', reason);
  process.exit(1);
});

// Iniciar el servidor solo si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}

module.exports = { startServer, gracefulShutdown };
