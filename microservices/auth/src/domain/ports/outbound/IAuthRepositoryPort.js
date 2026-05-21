class IAuthRepositoryPort {
  async findByEmail(email) { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
  async create(userData) { throw new Error('Not implemented'); }
  async update(userId, userData) { throw new Error('Not implemented'); }
  async findAdminLevelByUsuarioId(usuarioId) { throw new Error('Not implemented'); }
  async findClienteIdByUsuarioId(usuarioId) { throw new Error('Not implemented'); }
}

module.exports = IAuthRepositoryPort;
