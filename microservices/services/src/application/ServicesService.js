class ServicesService {
  constructor(servicesRepository) {
    this.servicesRepository = servicesRepository;
  }

  async createServicio(servicioData) {
    const dataToCreate = {
      nombre: servicioData.nombre,
      descripcion: servicioData.descripcion,
      recibo: servicioData.recibo
    };
    return await this.servicesRepository.createServicio(dataToCreate);
  }

  async getServicioById(idServicio) {
    return await this.servicesRepository.findServicioById(idServicio);
  }

  async getAllServicios(filters = {}) {
    const adjustedFilters = {};
    return await this.servicesRepository.findAllServicios(adjustedFilters);
  }

  async updateServicio(idServicio, servicioData) {
    const dataToUpdate = {};
    if (servicioData.nombre !== undefined) dataToUpdate.nombre = servicioData.nombre;
    if (servicioData.descripcion !== undefined) dataToUpdate.descripcion = servicioData.descripcion;
    if (servicioData.recibo !== undefined) dataToUpdate.recibo = servicioData.recibo;

    return await this.servicesRepository.updateServicio(idServicio, dataToUpdate);
  }

  async updateServicioStatus(idServicio, estado) {
     console.log(`Lógica de servicio para actualizar estado de ${idServicio} a ${estado}`);
     return await this.servicesRepository.updateServicio(idServicio, { estado: estado });
  }
}

module.exports = ServicesService;
