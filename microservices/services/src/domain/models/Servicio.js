const Money = require('../../../../shared/domain/value-objects/Money');

class Servicio {
  constructor({ idServicio, nombre, descripcion, recibo, imagenURL, tipo_servicio, sinopsis, fecha_evento, video_url, proveedor, rating, info_adicional_json, activo, cliente_id }) {
    if (!nombre || nombre.trim() === '') throw new Error('El nombre del servicio no puede estar vacío.');

    this.idServicio = idServicio;
    this.nombre = nombre;
    this.descripcion = descripcion || '';
    this.recibo = recibo instanceof Money ? recibo : new Money(recibo);
    this.imagenURL = imagenURL || null;
    this.tipo_servicio = tipo_servicio || 'UTILIDAD';
    this.sinopsis = sinopsis || null;
    this.fecha_evento = fecha_evento || null;
    this.video_url = video_url || null;
    this.proveedor = proveedor || null;
    this.rating = rating || null;
    this.info_adicional_json = info_adicional_json || null;
    this.activo = activo !== undefined ? activo : true;
    this.cliente_id = cliente_id || null;
  }

  esTipo(tipo) { return this.tipo_servicio === tipo; }
  esEntretenimiento() { return this.tipo_servicio === 'ENTRETENIMIENTO'; }
  esUtilidad() { return this.tipo_servicio === 'UTILIDAD'; }
  esDeBcp() { return this.proveedor === 'Banco de Crédito (BCP)'; }

  toJSON() {
    return {
      idServicio: this.idServicio, nombre: this.nombre, descripcion: this.descripcion,
      recibo: this.recibo.toJSON(), imagenURL: this.imagenURL, tipo_servicio: this.tipo_servicio,
      sinopsis: this.sinopsis, fecha_evento: this.fecha_evento, video_url: this.video_url,
      proveedor: this.proveedor, rating: this.rating,
      info_adicional_json: this.info_adicional_json, activo: this.activo, cliente_id: this.cliente_id,
    };
  }
}

module.exports = Servicio;
