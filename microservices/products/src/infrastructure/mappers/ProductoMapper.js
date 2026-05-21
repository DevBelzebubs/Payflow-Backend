const Producto = require('../../domain/models/Producto');

class ProductoMapper {
  static toDomain(data) {
    if (!data) return null;
    return new Producto({
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      stock: data.stock,
      categoria: data.categoria,
      activo: data.activo,
      imagen_url: data.imagen_url,
      marca: data.marca,
      especificaciones: typeof data.especificaciones === 'string'
        ? JSON.parse(data.especificaciones)
        : (data.especificaciones || {}),
      imagenes: typeof data.imagenes === 'string'
        ? JSON.parse(data.imagenes)
        : (data.imagenes || []),
      reseñas: typeof data.reseñas === 'string'
        ? JSON.parse(data.reseñas)
        : (data.reseñas || []),
    });
  }

  static toPersistence(producto) {
    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio.toFloat(),
      stock: producto.stock,
      categoria: producto.categoria,
      activo: producto.activo,
      imagen_url: producto.imagen_url,
      marca: producto.marca,
      especificaciones: JSON.stringify(producto.especificaciones),
    };
  }
}

module.exports = ProductoMapper;
