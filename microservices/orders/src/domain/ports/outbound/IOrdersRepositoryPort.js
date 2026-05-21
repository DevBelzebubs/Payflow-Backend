class IOrdersRepositoryPort {
  async createOrden(data) { throw new Error('Not implemented'); }
  async createItemOrden(data) { throw new Error('Not implemented'); }
  async findOrdenById(id) { throw new Error('Not implemented'); }
  async findOrdenesByCliente(clienteId) { throw new Error('Not implemented'); }
  async findAllOrdenes() { throw new Error('Not implemented'); }
  async updateOrden(id, data) { throw new Error('Not implemented'); }
  async reservarButacas(servicioId, seats, clienteId) { throw new Error('Not implemented'); }
  async createSuscripcion(data) { throw new Error('Not implemented'); }
  async findSuscripcionesParaRenovar() { throw new Error('Not implemented'); }
  async updateProximoPagoSuscripcion(id) { throw new Error('Not implemented'); }
}

module.exports = IOrdersRepositoryPort;
