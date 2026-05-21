const axios = require('axios');
const { resolveService } = require('../../../../../../../utils/ConsulResolver');
const IServiceServicePort = require('../../../../domain/ports/outbound/IServiceServicePort');

class ServiceServiceHttpClient extends IServiceServicePort {
  async getServicioById(servicioId) {
    const baseUrl = await resolveService('services-service');
    const response = await axios.get(`${baseUrl}/api/servicios/${servicioId}`);
    return response.data;
  }

  async getTicketTypes(servicioId) {
    const baseUrl = await resolveService('services-service');
    const response = await axios.get(`${baseUrl}/api/servicios/${servicioId}/tipos-entrada`);
    return response.data;
  }
}

module.exports = ServiceServiceHttpClient;
