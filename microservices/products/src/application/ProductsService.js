class ProductsService {
  constructor(productsRepository) {
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

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    const nuevoStock = producto.stock + cantidad;

    if (nuevoStock < 0) {
      throw new Error('Stock insuficiente');
    }

    return await this.productsRepository.updateProducto(productoId, { stock: nuevoStock });
  }
}

module.exports = ProductsService;
