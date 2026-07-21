class IProductsRepositoryPort {
  async createProducto(data) { throw new Error('Not implemented'); }
  async findProductoById(id) { throw new Error('Not implemented'); }
  async findAllProductos(filters) { throw new Error('Not implemented'); }
  async updateProducto(id, data) { throw new Error('Not implemented'); }
  async deleteProducto(id) { throw new Error('Not implemented'); }
  async addProductImages(productoId, urlList) { throw new Error('Not implemented'); }
  async createResena(clienteId, productoId, data) { throw new Error('Not implemented'); }
  async updateResena(resenaId, clienteId, data) { throw new Error('Not implemented'); }
  async deleteResena(resenaId, clienteId) { throw new Error('Not implemented'); }
  async hasClientePurchasedProduct(clienteId, productoId) { throw new Error('Not implemented'); }
  async findResenaById(resenaId) { throw new Error('Not implemented'); }
}

module.exports = IProductsRepositoryPort;
