class IServicesRepositoryPort {
  async createServicio(data) { throw new Error('Not implemented'); }
  async findServicioById(id) { throw new Error('Not implemented'); }
  async findAllServicios(filters) { throw new Error('Not implemented'); }
  async updateServicio(id, data) { throw new Error('Not implemented'); }
  async deleteServicio(id) { throw new Error('Not implemented'); }
  async findOccupiedSeats(idServicio) { throw new Error('Not implemented'); }
  async findTicketTypesByServiceId(idServicio) { throw new Error('Not implemented'); }
}

module.exports = IServicesRepositoryPort;
