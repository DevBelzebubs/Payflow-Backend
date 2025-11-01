class UsersService {
  constructor(usersRepository,authRepository) {
    this.usersRepository = usersRepository;
    this.authRepository = authRepository;
  }
  async findOrCreateClienteFromBcp(bcpUserData) {
    const { email, dni, bcpUsuarioId, nombreCompleto, telefono } = bcpUserData;

    if (!email) {
      throw new Error("El token JWT de BCP no contiene el claim 'email'.");
    }

    let payflowUser = await this.authRepository.findUserByEmail(email);

    if (!payflowUser) {
      console.log(`Usuario de BCP no encontrado (${email}). Creando...`);
      const newUserPayload = {
        email: email,
        password_hash: 'SSO_BCP_USER',
        nombre: nombreCompleto,
        telefono: telefono,
        activo: true
      };
      payflowUser = await this.authRepository.createUser(newUserPayload);
    }

    let payflowCliente = await this.usersRepository.findClienteByUsuarioId(payflowUser.id);

    if (!payflowCliente) {
      console.log(`Perfil de Cliente no encontrado para ${email}. Creando...`);
      const newClientePayload = {
        usuario_id: payflowUser.id
      };
      payflowCliente = await this.usersRepository.createCliente(newClientePayload);
    }
    return payflowCliente;
  }
  async createCliente(clienteData) {
    return await this.usersRepository.createCliente(clienteData);
  }

  async getClienteByUsuarioId(usuarioId) {
    return await this.usersRepository.findClienteByUsuarioId(usuarioId);
  }

  async updateCliente(clienteId, clienteData) {
    return await this.usersRepository.updateCliente(clienteId, clienteData);
  }

  async getAllClientes() {
    return await this.usersRepository.findAllClientes();
  }

  async createAdministrador(adminData) {
    return await this.usersRepository.createAdministrador(adminData);
  }

  async getAdministradorByUsuarioId(usuarioId) {
    return await this.usersRepository.findAdministradorByUsuarioId(usuarioId);
  }

  async getAllAdministradores() {
    return await this.usersRepository.findAllAdministradores();
  }
}

module.exports = UsersService;
