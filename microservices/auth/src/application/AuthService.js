const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor(authRepository) {
    this.authRepository = authRepository;
    this.JWT_SECRET = process.env.JWT_SECRET;

    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    if (!this.JWT_SECRET) {
      throw new Error("¡JWT_SECRET no está definido en .env! El servicio de Auth no puede iniciar.");
    }
  }

  async register(userData) {
    const existingUser = await this.authRepository.findUserByEmail(userData.email);

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);

    const userToCreate = {
      email: userData.email,
      password_hash: passwordHash,
      nombre: userData.nombre,
      telefono: userData.telefono || null,
      activo: true,
      dni: userData.dni,
      rol: 'CLIENTE'
    };

    const user = await this.authRepository.createUser(userToCreate);

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token
    };
  }

  async login(email, password) {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.isActive()) {
      throw new Error('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token
    };
  }

  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        rol:user.rol
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }
}

module.exports = AuthService;
