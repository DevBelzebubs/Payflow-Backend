const Money = require('../../../../shared/domain/value-objects/Money');

class Producto {
  constructor({ id, nombre, descripcion, precio, stock, categoria, activo, imagen_url, marca, especificaciones, imagenes, reseñas }) {
    if (!nombre || nombre.trim() === '') throw new Error('El nombre del producto no puede estar vacío');

    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion || '';
    this.precio = precio instanceof Money ? precio : new Money(precio);
    this.stock = stock || 0;
    this.categoria = categoria || 'GENERAL';
    this.activo = activo !== undefined ? activo : true;
    this.imagen_url = imagen_url || null;
    this.marca = marca || null;
    this.especificaciones = especificaciones || {};
    this.imagenes = imagenes || [];
    this.reseñas = reseñas || [];
  }

  isAvailable() {
    return this.activo && this.stock > 0;
  }

  hasStock(cantidad) {
    return this.stock >= cantidad;
  }

  descontarStock(cantidad) {
    if (this.stock < cantidad) {
      throw new Error(`Stock insuficiente: disponible ${this.stock}, requerido ${cantidad}`);
    }
    this.stock -= cantidad;
  }

  incrementarStock(cantidad) {
    this.stock += cantidad;
  }

  getRatingPromedio() {
    if (this.reseñas.length === 0) return 0;
    const sum = this.reseñas.reduce((acc, r) => acc + r.calificacion, 0);
    return sum / this.reseñas.length;
  }

  agregarImagen(url) {
    this.imagenes.push(url);
  }

  activar() { this.activo = true; }
  desactivar() { this.activo = false; }

  toJSON() {
    return {
      id: this.id, nombre: this.nombre, descripcion: this.descripcion,
      precio: this.precio.toJSON(), stock: this.stock, categoria: this.categoria,
      activo: this.activo, imagen_url: this.imagen_url, marca: this.marca,
      especificaciones: this.especificaciones, imagenes: this.imagenes,
      reseñas: this.reseñas,
      rating_promedio: this.getRatingPromedio(),
      total_reseñas: this.reseñas.length,
    };
  }
}

module.exports = Producto;
