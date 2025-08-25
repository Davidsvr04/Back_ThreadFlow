require('dotenv').config();

const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },

  // Configuración de la base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expiresIn: '24h'
  },

  // Configuración de logs
  logs: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  }
};

// Validar configuraciones críticas
const validateConfig = () => {
  const required = [
    'DB_NAME',
    'DB_USER', 
    'DB_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`❌ Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  console.log('✅ Configuración validada correctamente');
};

module.exports = {
  config,
  validateConfig
};
