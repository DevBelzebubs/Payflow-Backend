class Servicio {
  constructor({ idServicio, nombre, descripcion, recibo,imagenURL, tipo_servicio, sinopsis, fecha_evento, video_url, proveedor, rating, info_adicional_json,activo,cliente_id }) {
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
    this.imagenURL = imagenURL;
    this.tipo_servicio = tipo_servicio || 'UTILIDAD';
    this.sinopsis = sinopsis;
    this.fecha_evento = fecha_evento;
    this.video_url = video_url;
    this.proveedor = proveedor;
    this.rating = rating ? parseFloat(rating) : null;
    this.info_adicional_json = info_adicional_json || null;
    this.activo = activo;
    this.cliente_id = cliente_id;
  }

  toJSON() {
    return {
      idServicio: this.idServicio,
      nombre: this.nombre,
      descripcion: this.descripcion,
      recibo: parseFloat(this.recibo.toFixed(2)),
      imagenURL: this.imagenURL,
      tipo_servicio: this.tipo_servicio,
      sinopsis: this.sinopsis,
      fecha_evento: this.fecha_evento,
      video_url: this.video_url,
      proveedor: this.proveedor,
      rating: this.rating,
      info_adicional_json: this.info_adicional_json,
      activo: this.activo,
      cliente_id: this.cliente_id
    };
  }
}

module.exports = Servicio;