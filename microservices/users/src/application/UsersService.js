class UsersService {
  constructor(usersRepository, authRepository) {
    this.usersRepository = usersRepository;
    this.authRepository = authRepository;
  }
  async findOrCreateClienteFromBcp(bcpUserData) {
    const { email, dni, bcpUsuarioId, nombreCompleto, telefono } = bcpUserData;

    if (!email) {
      throw new Error("El token JWT de BCP no contiene el claim 'email'.");
    }
    if (!dni) {
      throw new Error("El token JWT de BCP no contiene el claim 'dni'.");
    }
    let payflowUser = await this.authRepository.findUserByEmail(email);

    if (!payflowUser) {
      console.log(`Usuario de BCP no encontrado (${email}). Creando...`);
      const newUserPayload = {
        email: email,
        password_hash: "SSO_BCP_USER",
        nombre: nombreCompleto,
        telefono: telefono,
        activo: true,
        dni: dni,
        rol: "CLIENTE",
      };
      try {
        payflowUser = await this.authRepository.createUser(newUserPayload);
      } catch (createError) {
        console.error(
          `[UsersService] Fallo al crear usuario: ${createError.message}`
        );
        throw new Error(
          `Fallo de SQL al crear usuario: ${createError.message}`
        );
      }
    }

    let payflowCliente = await this.usersRepository.findClienteByUsuarioId(
      payflowUser.id
    );

    if (!payflowCliente) {
      console.log(`Perfil de Cliente no encontrado para ${email}. Creando...`);

      payflowCliente = await this.usersRepository.createCliente(payflowUser);
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
