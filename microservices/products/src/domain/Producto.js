class Producto {
  constructor({ id, nombre, descripcion, precio, stock, categoria, activo }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.stock = stock;
    this.categoria = categoria;
    this.activo = activo;
    this.imagen_url = imagen_url;
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
      imagen_url: this.imagen_url
    };
  }
}

module.exports = Producto;
