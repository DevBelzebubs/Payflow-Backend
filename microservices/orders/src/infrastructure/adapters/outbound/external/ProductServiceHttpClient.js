const axios = require('axios');
const { resolveService } = require('../../../../../../../utils/ConsulResolver');
const IProductServicePort = require('../../../../domain/ports/outbound/IProductServicePort');

class ProductServiceHttpClient extends IProductServicePort {
  async getProductoById(productoId) {
    const baseUrl = await resolveService('products-service');
    const response = await axios.get(`${baseUrl}/api/productos/${productoId}`);
    return response.data;
  }

  async descontarStock(productoId, cantidad) {
    const baseUrl = await resolveService('products-service');
    await axios.patch(`${baseUrl}/api/productos/${productoId}/stock`, { cantidad: -cantidad });
  }
}

module.exports = ProductServiceHttpClient;
