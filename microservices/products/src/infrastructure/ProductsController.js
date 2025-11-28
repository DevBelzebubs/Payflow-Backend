const cloudinary = require('./cloudinaryConfig'); 
async function uploadFile(file, folder) {
    if (!file || !file.tempFilePath) return null;
    try {
        const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder: `payflow/gasfiteria/${folder}`,
            resource_type: "auto",
        });
        return result.secure_url;
    } catch (uploadError) {
        console.error(`[Cloudinary Upload Error] Carpeta: ${folder}`, uploadError);
        throw new Error(`Fallo en la subida de la imagen de ${folder}. Detalle: ${uploadError.message}`);
    }
}

class ProductsController {
  constructor(productsService) {
    this.productsService = productsService;
  }
  
  
  async createProducto(req, res) {
    try {
      const { 
        nombre, descripcion, precio, stock, categoria, 
        marca, especificaciones 
      } = req.body;

      if (!nombre || !precio) {
        return res.status(400).json({ error: 'Nombre y precio son requeridos' });
      }

      const files = req.files || {};
      const imagenPortadaFile = files.imagenPortada; 
      const imagenesGaleriaFiles = files.imagenesGaleria; 

      let imagen_url = null;
      let galleryUrls = [];
      
      if (imagenPortadaFile) {
          imagen_url = await uploadFile(imagenPortadaFile, "portadas"); 
      }
      
      const filesToProcess = Array.isArray(imagenesGaleriaFiles) 
          ? imagenesGaleriaFiles 
          : (imagenesGaleriaFiles ? [imagenesGaleriaFiles] : []);

      for (const file of filesToProcess) {
          const url = await uploadFile(file, "galeria");
          if (url) {
             galleryUrls.push(url);
          }
      }

      const producto = await this.productsService.createProducto({
        nombre,
        descripcion,
        precio,
        stock: stock || 0,
        categoria,
        activo: true,
        imagen_url,
        marca,
        especificaciones 
      });

      if (galleryUrls.length > 0) {
          await this.productsService.addProductImages(producto.id, galleryUrls);
      }

      res.status(201).json(producto.toJSON());
    } catch (error) {
      const errorMessage = error.message.includes("Fallo en la subida de la imagen") 
          ? error.message 
          : error.message || "Error al crear el producto. Revise los logs del servidor.";

      console.error("[ProductsController] Error en createProducto:", error);
      res.status(400).json({ error: errorMessage });
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