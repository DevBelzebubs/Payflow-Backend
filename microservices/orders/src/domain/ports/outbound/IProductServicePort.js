class IProductServicePort {
  async getProductoById(productoId) { throw new Error('Not implemented'); }
  async descontarStock(productoId, cantidad) { throw new Error('Not implemented'); }
}

module.exports = IProductServicePort;
