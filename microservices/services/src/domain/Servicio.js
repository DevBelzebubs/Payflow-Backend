class Servicio {
  constructor({ id, nombre, descripcion, precio, duracionEstimada, categoria, activo }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.duracionEstimada = duracionEstimada;
    this.categoria = categoria;
    this.activo = activo;
  }

  isAvailable() {
    return this.activo;
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: parseFloat(this.precio),
      duracionEstimada: this.duracionEstimada,
      categoria: this.categoria,
      activo: this.activo
    };
  }
}

module.exports = Servicio;
