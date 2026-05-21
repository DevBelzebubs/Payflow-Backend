const Servicio = require('../../domain/models/Servicio');

class ServicioMapper {
  static toDomain(data) {
    if (!data) return null;
    return new Servicio({
      idServicio: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      recibo: data.precio,
      estado: data.estado,
      imagenURL: data.imagen_url,
      activo: data.activo,
      tipo_servicio: data.tipo_servicio,
      sinopsis: data.sinopsis,
      fecha_evento: data.fecha_evento,
      video_url: data.video_url,
      proveedor: data.proveedor,
      rating: data.rating,
      info_adicional_json: data.info_adicional_json
        ? (typeof data.info_adicional_json === 'string'
            ? JSON.parse(data.info_adicional_json)
            : data.info_adicional_json)
        : null,
      cliente_id: data.cliente_id,
    });
  }

  static toPersistence(servicio) {
    const data = {};
    if (servicio.nombre !== undefined) data.nombre = servicio.nombre;
    if (servicio.descripcion !== undefined) data.descripcion = servicio.descripcion;
    if (servicio.recibo !== undefined) data.precio = servicio.recibo.toFloat();
    if (servicio.estado !== undefined) data.estado = servicio.estado;
    if (servicio.imagenURL !== undefined) data.imagen_url = servicio.imagenURL;
    if (servicio.activo !== undefined) data.activo = servicio.activo;
    if (servicio.tipo_servicio !== undefined) data.tipo_servicio = servicio.tipo_servicio;
    if (servicio.sinopsis !== undefined) data.sinopsis = servicio.sinopsis;
    if (servicio.fecha_evento !== undefined) data.fecha_evento = servicio.fecha_evento;
    if (servicio.video_url !== undefined) data.video_url = servicio.video_url;
    if (servicio.proveedor !== undefined) data.proveedor = servicio.proveedor;
    if (servicio.rating !== undefined) data.rating = servicio.rating;
    if (servicio.cliente_id !== undefined) data.cliente_id = servicio.cliente_id;
    if (servicio.info_adicional_json !== undefined) {
      data.info_adicional_json = JSON.stringify(servicio.info_adicional_json);
    }
    return data;
  }

  static toDTO(servicio) {
    return servicio ? servicio.toJSON() : null;
  }
}

module.exports = ServicioMapper;
