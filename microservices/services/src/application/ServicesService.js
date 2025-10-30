class ServicesService {
  constructor(servicesRepository) {
    this.servicesRepository = servicesRepository;
  }

  async createServicio(servicioData) {
    return await this.servicesRepository.createServicio(servicioData);
  }

  async getServicioById(servicioId) {
    return await this.servicesRepository.findServicioById(servicioId);
  }

  async getAllServicios(filters = {}) {
    return await this.servicesRepository.findAllServicios(filters);
  }

  async updateServicio(servicioId, servicioData) {
    return await this.servicesRepository.updateServicio(servicioId, servicioData);
  }

  async deleteServicio(servicioId) {
    return await this.servicesRepository.deleteServicio(servicioId);
  }
}

module.exports = ServicesService;
