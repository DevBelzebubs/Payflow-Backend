class ProductsService {
  constructor({ productsRepository }) {
    this.productsRepository = productsRepository;
  }

  async createProducto(productoData) {
    return await this.productsRepository.createProducto(productoData);
  }

  async getProductoById(productoId) {
    return await this.productsRepository.findProductoById(productoId);
  }

  async getAllProductos(filters = {}) {
    return await this.productsRepository.findAllProductos(filters);
  }

  async updateProducto(productoId, productoData) {
    return await this.productsRepository.updateProducto(productoId, productoData);
  }

  async deleteProducto(productoId) {
    return await this.productsRepository.deleteProducto(productoId);
  }

  async updateStock(productoId, cantidad) {
    const producto = await this.productsRepository.findProductoById(productoId);
    if (!producto) throw new Error('Producto no encontrado');

    producto.descontarStock(-cantidad);
    return await this.productsRepository.updateProducto(productoId, { stock: producto.stock });
  }

  async addProductImages(productoId, urlList) {
    return await this.productsRepository.addProductImages(productoId, urlList);
  }

  async createResena(clienteId, productoId, data) {
    const hasPurchased = await this.productsRepository.hasClientePurchasedProduct(clienteId, productoId);
    if (!hasPurchased) {
      throw new Error('Solo puedes reseñar productos que hayas comprado');
    }
    await this.productsRepository.createResena(clienteId, productoId, data);
    return await this.productsRepository.findProductoById(productoId);
  }

  async updateResena(resenaId, clienteId, data) {
    const existing = await this.productsRepository.findResenaById(resenaId);
    if (!existing) throw new Error('Reseña no encontrada');
    if (existing.cliente_id !== clienteId) throw new Error('No tienes permiso para editar esta reseña');
    await this.productsRepository.updateResena(resenaId, clienteId, data);
    return await this.productsRepository.findProductoById(existing.producto_id);
  }

  async deleteResena(resenaId, clienteId) {
    const existing = await this.productsRepository.findResenaById(resenaId);
    if (!existing) throw new Error('Reseña no encontrada');
    if (existing.cliente_id !== clienteId) throw new Error('No tienes permiso para eliminar esta reseña');
    await this.productsRepository.deleteResena(resenaId, clienteId);
    return await this.productsRepository.findProductoById(existing.producto_id);
  }
}

module.exports = ProductsService;
