class ProductsController {
  constructor(productsService) {
    this.productsService = productsService;
  }

  async createProducto(req, res) {
    try {
      const { nombre, descripcion, precio, stock, categoria, imagen_url } = req.body;

      if (!nombre || !precio) {
        return res.status(400).json({ error: 'Nombre y precio son requeridos' });
      }

      const producto = await this.productsService.createProducto({
        nombre,
        descripcion,
        precio,
        stock: stock || 0,
        categoria,
        activo: true,
        imagen_url
      });

      res.status(201).json(producto.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProducto(req, res) {
    try {
      const { productoId } = req.params;

      const producto = await this.productsService.getProductoById(productoId);

      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.status(200).json(producto.toJSON());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllProductos(req, res) {
    try {
      const filters = {
        activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : undefined,
        categoria: req.query.categoria
      };

      const productos = await this.productsService.getAllProductos(filters);

      res.status(200).json(productos.map(p => p.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProducto(req, res) {
    try {
      const { productoId } = req.params;
      const updateData = req.body;

      const producto = await this.productsService.updateProducto(productoId, updateData);

      res.status(200).json(producto.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteProducto(req, res) {
    try {
      const { productoId } = req.params;

      await this.productsService.deleteProducto(productoId);

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateStock(req, res) {
    try {
      const { productoId } = req.params;
      const { cantidad } = req.body;

      if (cantidad === undefined) {
        return res.status(400).json({ error: 'Cantidad es requerida' });
      }

      const producto = await this.productsService.updateStock(productoId, cantidad);

      res.status(200).json(producto.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = ProductsController;
