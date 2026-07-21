const Producto = require('../../domain/models/Producto');
const Reseña = require('../../domain/models/Reseña');

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

  static toResenaDomain(data) {
    if (!data) return null;
    return new Reseña({
      id: data.id,
      clienteId: data.cliente_id,
      productoId: data.producto_id,
      calificacion: data.calificacion,
      titulo: data.titulo,
      comentario: data.comentario,
      createdAt: data.created_at,
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
