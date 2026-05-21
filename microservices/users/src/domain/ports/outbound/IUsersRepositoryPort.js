class IUsersRepositoryPort {
  async createCliente(userEntity) { throw new Error('Not implemented'); }
  async findClienteByUsuarioId(usuarioId) { throw new Error('Not implemented'); }
  async updateCliente(clienteId, data) { throw new Error('Not implemented'); }
  async findAllClientes() { throw new Error('Not implemented'); }
  async createAdministrador(data) { throw new Error('Not implemented'); }
  async findAdministradorByUsuarioId(usuarioId) { throw new Error('Not implemented'); }
  async findAllAdministradores() { throw new Error('Not implemented'); }
  async deleteAdministrador(adminId) { throw new Error('Not implemented'); }
  async findAllUsuarios() { throw new Error('Not implemented'); }
  async findUsuarioById(id) { throw new Error('Not implemented'); }
  async updateUser(userId, data) { throw new Error('Not implemented'); }
  async updateUsuarioRol(usuarioId, rol, nivelAcceso) { throw new Error('Not implemented'); }
  async toggleUsuarioActivo(usuarioId) { throw new Error('Not implemented'); }
  async getAdminStats() { throw new Error('Not implemented'); }
}

module.exports = IUsersRepositoryPort;
