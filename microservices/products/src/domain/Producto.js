class Producto {
  constructor({ id, nombre, descripcion, precio, stock, categoria, activo,imagen_url,marca, especificaciones,imagenes, reseñas }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.stock = stock;
    this.categoria = categoria;
    this.activo = activo;
    this.imagen_url = imagen_url;
    this.marca = marca;
    this.especificaciones = especificaciones || {};
    this.imagenes = imagenes || [];
    this.reseñas = reseñas || [];
  }

  isAvailable() {
    return this.activo && this.stock > 0;
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: parseFloat(this.precio),
      stock: this.stock,
      categoria: this.categoria,
      activo: this.activo,
      imagen_url: this.imagen_url,
      
      marca: this.marca,
      especificaciones: this.especificaciones,
      imagenes: this.imagenes,
      reseñas: this.reseñas,
      rating_promedio: this.reseñas.length > 0
        ? this.reseñas.reduce((acc, r) => acc + r.calificacion, 0) / this.reseñas.length
        : 0,
      total_reseñas: this.reseñas.length
    };
  }
}

module.exports = Producto;
