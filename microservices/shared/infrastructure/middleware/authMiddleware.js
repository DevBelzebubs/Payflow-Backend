const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const processName = process.env.API_GATEWAY_PORT ? '[Gateway]' : '[AuthService]';

  try {
    console.log(`${processName} Middleware: Petición recibida: ${req.method} ${req.path}`);
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.error(`${processName} Middleware: Error - Token no proporcionado.`);
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error(`${processName} Middleware: Error - ¡JWT_SECRET es UNDEFINED!`);
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(`${processName} Middleware: ¡FALLO DE TOKEN! Error: ${error.message}`);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
