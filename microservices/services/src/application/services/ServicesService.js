class ServicesService {
  constructor({ servicesRepository, bcpServiceClient }) {
    this.servicesRepository = servicesRepository;
    this.bcpServiceClient = bcpServiceClient;
  }

  async createServicio(servicioData) {
    const dataToCreate = {
      nombre: servicioData.nombre,
      descripcion: servicioData.descripcion,
      recibo: servicioData.recibo,
    };
    return await this.servicesRepository.createServicio(dataToCreate);
  }

  async getServicioById(idServicio) {
    return await this.servicesRepository.findServicioById(idServicio);
  }

  async getAllServicios(filters = {}) {
    return await this.servicesRepository.findAllServicios(filters);
  }

  async getServiciosBCP(userBcpData) {
    const { dni, clienteId } = userBcpData;
    if (!dni) throw new Error("El token JWT de BCP no contiene el claim 'dni'.");
    return await this.bcpServiceClient.getPendingDebts(dni, clienteId);
  }

  async getMisDeudasPendientes(userTokenData) {
    const { dni } = userTokenData;
    if (!dni) return [];
    return await this.bcpServiceClient.getMisDeudas(dni);
  }

  async updateServicio(idServicio, servicioData) {
    const dataToUpdate = {};
    if (servicioData.nombre !== undefined) dataToUpdate.nombre = servicioData.nombre;
    if (servicioData.descripcion !== undefined) dataToUpdate.descripcion = servicioData.descripcion;
    if (servicioData.recibo !== undefined) dataToUpdate.recibo = servicioData.recibo;
    return await this.servicesRepository.updateServicio(idServicio, dataToUpdate);
  }

  async updateServicioStatus(idServicio, estado) {
    return await this.servicesRepository.updateServicio(idServicio, { estado });
  }

  async deleteServicio(idServicio) {
    return await this.servicesRepository.deleteServicio(idServicio);
  }

  async getOccupiedSeats(idServicio) {
    return await this.servicesRepository.findOccupiedSeats(idServicio);
  }

  async getTicketTypes(idServicio) {
    return await this.servicesRepository.findTicketTypesByServiceId(idServicio);
  }
}

module.exports = ServicesService;
