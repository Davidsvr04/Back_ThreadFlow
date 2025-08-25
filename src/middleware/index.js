/**
 * Middleware para validar IDs en parámetros de rutas
 */
const validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: `${paramName} inválido. Debe ser un número entero positivo`,
        received: id
      });
    }

    // Convertir a número para uso posterior
    req.params[paramName] = parseInt(id);
    next();
  };
};

/**
 * Middleware para logging de requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Request:', JSON.stringify(logData, null, 2));
    }
  });
  
  next();
};

/**
 * Middleware para manejo de errores async
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para validar JSON
 */
const validateJSON = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Body JSON requerido pero no proporcionado'
        });
      }
    }
  }
  next();
};

/**
 * Middleware para rate limiting básico
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpiar requests antiguos
    if (requests.has(key)) {
      requests.set(key, requests.get(key).filter(time => time > windowStart));
    } else {
      requests.set(key, []);
    }
    
    const requestsInWindow = requests.get(key);
    
    if (requestsInWindow.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas peticiones. Intenta más tarde.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    requestsInWindow.push(now);
    next();
  };
};

/**
 * Middleware para sanitizar datos de entrada
 */
const sanitizeInput = (req, res, next) => {
  // Función helper para sanitizar strings
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  // Función recursiva para sanitizar objetos
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  };

  // Sanitizar body, query y params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = {
  validateIdParam,
  requestLogger,
  asyncHandler,
  validateJSON,
  createRateLimiter,
  sanitizeInput
};
