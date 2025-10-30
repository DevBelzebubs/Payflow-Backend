class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
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
