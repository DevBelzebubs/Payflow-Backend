class UsersService {
  constructor({ usersRepository, authRepository, bankAccountService, passwordHasher }) {
    this.usersRepository = usersRepository;
    this.authRepository = authRepository;
    this.bankAccountService = bankAccountService;
    this.passwordHasher = passwordHasher;
  }

  async findOrCreateClienteFromBcp(bcpUserData) {
    const { email, dni, bcpUsuarioId, nombreCompleto, telefono } = bcpUserData;

    if (!email) throw new Error("El token JWT de BCP no contiene el claim 'email'.");
    if (!dni) throw new Error("El token JWT de BCP no contiene el claim 'dni'.");

    let payflowUser = await this.authRepository.findByEmail(email);
    let isNewUser = false;

    if (!payflowUser) {
      payflowUser = await this.authRepository.create({
        email,
        password_hash: 'SSO_BCP_USER',
        nombre: nombreCompleto,
        telefono,
        activo: true,
        dni,
        rol: 'CLIENTE',
      });
    }

    let payflowCliente = await this.usersRepository.findClienteByUsuarioId(payflowUser.id);

    if (!payflowCliente) {
      payflowCliente = await this.usersRepository.createCliente(payflowUser);
      isNewUser = true;

      try {
        await this.bankAccountService.createWallet(payflowCliente.id, payflowUser.id, payflowUser.nombre);
      } catch (err) {
        throw new Error(`Error al crear el monedero: ${err.message}`);
      }
    }

    return { cliente: payflowCliente, isNewUser };
  }

  async createCliente(clienteData) {
    const payflowCliente = await this.usersRepository.createCliente(clienteData);

    try {
      await this.bankAccountService.createWallet(payflowCliente.id, payflowCliente.usuarioId, payflowCliente.nombre);
    } catch (walletError) {
      throw new Error(`El cliente se creó, pero no se pudo generar el monedero: ${walletError.message}`);
    }

    return payflowCliente;
  }

  async updateUserProfile(clientData) {
    const { usuarioId } = clientData;
    if (!usuarioId) throw new Error('usuarioId es requerido');

    const payflowUser = await this.authRepository.findById(usuarioId);
    if (!payflowUser) throw new Error(`Usuario no encontrado (ID: ${usuarioId})`);

    const dataToUpdate = {};
    const esUsuarioBCP = payflowUser.isBcpUser();

    if (esUsuarioBCP) {
      if (clientData.telefono !== undefined) dataToUpdate.telefono = clientData.telefono;
      if (clientData.avatar_url !== undefined) dataToUpdate.avatar_url = clientData.avatar_url;
      if (clientData.banner_url !== undefined) dataToUpdate.banner_url = clientData.banner_url;
    } else {
      if (clientData.nombre !== undefined) dataToUpdate.nombre = clientData.nombre;
      if (clientData.telefono !== undefined) dataToUpdate.telefono = clientData.telefono;
      if (clientData.email !== undefined) dataToUpdate.email = clientData.email;
      if (clientData.avatar_url !== undefined) dataToUpdate.avatar_url = clientData.avatar_url;
      if (clientData.banner_url !== undefined) dataToUpdate.banner_url = clientData.banner_url;
      if (clientData.password) {
        dataToUpdate.password_hash = await this.passwordHasher.hash(clientData.password);
      }
    }

    if (Object.keys(dataToUpdate).length === 0) return payflowUser;

    return await this.usersRepository.updateUser(usuarioId, dataToUpdate);
  }

  async getClienteByUsuarioId(usuarioId) { return await this.usersRepository.findClienteByUsuarioId(usuarioId); }
  async updateCliente(clienteId, clienteData) { return await this.usersRepository.updateCliente(clienteId, clienteData); }
  async getAllClientes() { return await this.usersRepository.findAllClientes(); }
  async getAllUsuarios() { return await this.usersRepository.findAllUsuarios(); }
  async getUsuarioById(id) { return await this.usersRepository.findUsuarioById(id); }
  async updateUsuarioRol(usuarioId, rol, nivelAcceso) { return await this.usersRepository.updateUsuarioRol(usuarioId, rol, nivelAcceso); }
  async toggleUsuarioActivo(usuarioId) { return await this.usersRepository.toggleUsuarioActivo(usuarioId); }
  async getAdminStats() { return await this.usersRepository.getAdminStats(); }
  async deleteAdministrador(adminId) { return await this.usersRepository.deleteAdministrador(adminId); }
  async createAdministrador(adminData) { return await this.usersRepository.createAdministrador(adminData); }
  async getAdministradorByUsuarioId(usuarioId) { return await this.usersRepository.findAdministradorByUsuarioId(usuarioId); }
  async getAllAdministradores() { return await this.usersRepository.findAllAdministradores(); }
}

module.exports = UsersService;
