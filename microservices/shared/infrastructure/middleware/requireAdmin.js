const jwt = require('jsonwebtoken');
const axios = require('axios');

const requireAdmin = (...allowedLevels) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) return res.status(500).json({ error: 'Error de configuración del servidor' });

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      const isAdminByToken = decoded.rol === 'ADMIN' || decoded.rol === 'admin';
      if (!isAdminByToken) {
        try {
          const usersUrl = process.env.USERS_URL || 'http://localhost:3002';
          const verifyRes = await axios.get(`${usersUrl}/api/admin/verify`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000,
          });
          if (!verifyRes.data.isAdmin) {
            return res.status(403).json({ error: 'Acceso denegado: se requieren permisos de administrador' });
          }
          req.user.nivelAcceso = verifyRes.data.nivelAcceso;
        } catch (verifyErr) {
          console.error('[requireAdmin] Error verificando admin en DB:', verifyErr.message);
          return res.status(403).json({ error: 'Acceso denegado: no se pudo verificar permisos' });
        }
      }

      if (allowedLevels.length > 0 && req.user.nivelAcceso) {
        if (!allowedLevels.includes(req.user.nivelAcceso)) {
          return res.status(403).json({ error: `Acceso denegado: se requiere nivel ${allowedLevels.join(' o ')}` });
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
};

module.exports = requireAdmin;
