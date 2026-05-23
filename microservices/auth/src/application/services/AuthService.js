class AuthService {
  constructor({ authRepository, passwordHasher, tokenGenerator, bcpAuthClient, userServiceClient }) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
    this.tokenGenerator = tokenGenerator;
    this.bcpAuthClient = bcpAuthClient;
    this.userServiceClient = userServiceClient;
  }

  async register(userData) {
    const existingUser = await this.authRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const passwordHash = await this.passwordHasher.hash(userData.password);
    const user = await this.authRepository.create({
      email: userData.email,
      password_hash: passwordHash,
      nombre: userData.nombre,
      telefono: userData.telefono || null,
      activo: true,
      dni: userData.dni,
      rol: 'CLIENTE',
    });

    const token = await this._generateUserToken(user, 'PAYFLOW', null);

    return { user: user.toJSON(), token };
  }

  async login(email, password) {
    const user = await this.authRepository.findByEmail(email);

    if (user && !user.isBcpUser()) {
      if (!user.isActive()) {
        throw new Error('Usuario inactivo');
      }
      const isValid = await this.passwordHasher.compare(password, user.passwordHash);
      if (isValid) {
        let clienteId = null;
        try {
          clienteId = await this.authRepository.findClienteIdByUsuarioId(user.id);
        } catch (err) {
          // clienteId may not exist yet
        }
        const token = await this._generateUserToken(user, 'PAYFLOW', clienteId);
        return { user: user.toJSON(), clienteId, token };
      }
    }

    return await this._loginViaBcp(email, password);
  }

  async _loginViaBcp(email, password) {
    const bcpToken = await this.bcpAuthClient.login(email, password);
    const { cliente: syncedCliente, isNewUser } = await this.userServiceClient.syncBcpUser(bcpToken);

    const emailReal = syncedCliente.correo;
    const user = await this.authRepository.findByEmail(emailReal);
    if (!user) {
      throw new Error('La sincronización falló, el usuario no se encuentra localmente');
    }

    const payflowToken = await this._generateUserToken(user, 'BCP', syncedCliente.id);
    return {
      user: user.toJSON(),
      clienteId: syncedCliente.id,
      token: payflowToken,
      isNewUser: isNewUser || false,
    };
  }

  async _generateUserToken(user, userType, clienteId) {
    let nivelAcceso = null;
    if (user.isAdmin()) {
      try {
        nivelAcceso = await this.authRepository.findAdminLevelByUsuarioId(user.id);
      } catch (err) {
        // non-critical
      }
    }
    return this.tokenGenerator.generate({
      userId: user.id,
      clienteId,
      email: user.email.toString(),
      rol: user.rol,
      dni: user.dni ? user.dni.toString() : null,
      userType,
      nivelAcceso,
    });
  }

  async demoLogin() {
    const token = await this.tokenGenerator.generate({
      userId: 'demo-user-0000',
      clienteId: 'demo-cliente-0000',
      email: 'demo@payflow.com',
      rol: 'DEMO',
      dni: '00000000',
      userType: 'PAYFLOW',
      nivelAcceso: 'demo',
    });
    return {
      user: {
        id: 'demo-user-0000',
        email: 'demo@payflow.com',
        nombre: 'Usuario Demo',
        telefono: null,
        activo: true,
        dni: '00000000',
        rol: 'DEMO',
        nivelAcceso: 'demo',
      },
      token,
      clienteId: 'demo-cliente-0000',
      isNewUser: false,
    };
  }

  verifyToken(token) {
    return this.tokenGenerator.verify(token);
  }
}

module.exports = AuthService;
