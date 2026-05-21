class IProductsRepositoryPort {
  async createProducto(data) { throw new Error('Not implemented'); }
  async findProductoById(id) { throw new Error('Not implemented'); }
  async findAllProductos(filters) { throw new Error('Not implemented'); }
  async updateProducto(id, data) { throw new Error('Not implemented'); }
  async deleteProducto(id) { throw new Error('Not implemented'); }
  async addProductImages(productoId, urlList) { throw new Error('Not implemented'); }
}

module.exports = IProductsRepositoryPort;
