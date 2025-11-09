class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(req, res) {
    try {
      const { email, password, nombre, telefono, dni } = req.body;

      if (!email || !password || !nombre || !dni) {
        return res.status(400).json({
          error: 'Email, password, nombre y DNI son requeridos'
        });
      }

      const result = await this.authService.register({
        email,
        password,
        nombre,
        telefono,
        dni
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email y password son requeridos'
        });
      }

      const result = await this.authService.login(email, password);

      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
      }

      const decoded = this.authService.verifyToken(token);

      res.status(200).json({ valid: true, decoded });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
