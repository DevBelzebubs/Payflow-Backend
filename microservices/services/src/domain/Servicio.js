class Servicio {
  constructor({ idServicio, nombre, descripcion, recibo }) {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre del servicio no puede estar vacío.');
    }
    const montoRecibo = parseFloat(recibo);
    if (isNaN(montoRecibo) || montoRecibo <= 0) {
      throw new Error('El recibo (monto) debe ser un número positivo.');
    }

    this.idServicio = idServicio;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.recibo = montoRecibo;
  }

  toJSON() {
    return {
      idServicio: this.idServicio,
      nombre: this.nombre,
      descripcion: this.descripcion,
      recibo: parseFloat(this.recibo.toFixed(2)),
    };
  }
}

module.exports = Servicio;