const Servicio = require('../domain/Servicio');

class SupabaseServicesRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  mapToDomain(data) {
    if (!data) return null;
    return new Servicio({
      idServicio: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      recibo: data.precio,
      imagenURL: data.imagen_url,
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
      activo: data.activo,
      cliente_id: data.cliente_id,
    });
  }

  mapToDb(servicio) {
    const data = {};
    if (servicio.nombre !== undefined) data.nombre = servicio.nombre;
    if (servicio.descripcion !== undefined) data.descripcion = servicio.descripcion;
    if (servicio.recibo !== undefined) data.precio = servicio.recibo;
    if (servicio.imagenURL !== undefined) data.imagen_url = servicio.imagenURL;
    if (servicio.tipo_servicio !== undefined) data.tipo_servicio = servicio.tipo_servicio;
    if (servicio.sinopsis !== undefined) data.sinopsis = servicio.sinopsis;
    if (servicio.fecha_evento !== undefined) data.fecha_evento = servicio.fecha_evento;
    if (servicio.video_url !== undefined) data.video_url = servicio.video_url;
    if (servicio.proveedor !== undefined) data.proveedor = servicio.proveedor;
    if (servicio.rating !== undefined) data.rating = servicio.rating;
    if (servicio.activo !== undefined) data.activo = servicio.activo;
    if (servicio.cliente_id !== undefined) data.cliente_id = servicio.cliente_id;
    if (servicio.info_adicional_json !== undefined) {
      data.info_adicional_json = JSON.stringify(servicio.info_adicional_json);
    }
    return data;
  }

  async createServicio(servicioData) {
    const dbMappedData = this.mapToDb(servicioData);

    const { data, error } = await this.supabase
      .from('servicios')
      .insert([dbMappedData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando servicio: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async findServicioById(idServicio) {
    const { data, error } = await this.supabase
      .from('servicios')
      .select('*')
      .eq('id', idServicio)
      .maybeSingle();

    if (error) {
      throw new Error(`Error buscando servicio: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async findAllServicios(filters = {}) {
    let query = this.supabase.from('servicios').select('*');

    if (filters.activo !== undefined) {
      query = query.eq('activo', filters.activo);
    }

    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error obteniendo servicios: ${error.message}`);
    }

    return data.map(item => this.mapToDomain(item));
  }

  async updateServicio(servicioId, servicioData) {
    const dbMappedData = this.mapToDb(servicioData);

    const { data, error } = await this.supabase
      .from('servicios')
      .update(dbMappedData)
      .eq('id', servicioId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando servicio: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async deleteServicio(servicioId) {
    const { error } = await this.supabase
      .from('servicios')
      .delete()
      .eq('id', servicioId);

    if (error) {
      throw new Error(`Error eliminando servicio: ${error.message}`);
    }

    return true;
  }
}

module.exports = SupabaseServicesRepository;
