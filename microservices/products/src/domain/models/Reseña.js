class Reseña {
  constructor({ id, clienteId, productoId, calificacion, titulo, comentario, createdAt }) {
    if (!clienteId) throw new Error('El clienteId es requerido');
    if (!productoId) throw new Error('El productoId es requerido');
    if (calificacion === undefined || calificacion === null) throw new Error('La calificación es requerida');
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      throw new Error('La calificación debe ser un número entero del 1 al 5');
    }
    if (!titulo || titulo.trim() === '') throw new Error('El título de la reseña es requerido');
    if (!comentario || comentario.trim() === '') throw new Error('El comentario de la reseña es requerido');

    this.id = id;
    this.clienteId = clienteId;
    this.productoId = productoId;
    this.calificacion = calificacion;
    this.titulo = titulo.trim();
    this.comentario = comentario.trim();
    this.createdAt = createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      cliente_id: this.clienteId,
      producto_id: this.productoId,
      calificacion: this.calificacion,
      titulo: this.titulo,
      comentario: this.comentario,
      created_at: this.createdAt,
    };
  }
}

module.exports = Reseña;
