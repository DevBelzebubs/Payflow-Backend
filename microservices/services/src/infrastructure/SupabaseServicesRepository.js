const Servicio = require('../domain/Servicio');

class SupabaseServicesRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async createServicio(servicioData) {
    const { data, error } = await this.supabase
      .from('servicios')
      .insert([servicioData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando servicio: ${error.message}`);
    }

    return new Servicio({
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      duracionEstimada: data.duracion_estimada,
      categoria: data.categoria,
      activo: data.activo
    });
  }

  async findServicioById(servicioId) {
    const { data, error } = await this.supabase
      .from('servicios')
      .select('*')
      .eq('id', servicioId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error buscando servicio: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return new Servicio({
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      duracionEstimada: data.duracion_estimada,
      categoria: data.categoria,
      activo: data.activo
    });
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

    return data.map(item => new Servicio({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio,
      duracionEstimada: item.duracion_estimada,
      categoria: item.categoria,
      activo: item.activo
    }));
  }

  async updateServicio(servicioId, servicioData) {
    const { data, error } = await this.supabase
      .from('servicios')
      .update(servicioData)
      .eq('id', servicioId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando servicio: ${error.message}`);
    }

    return new Servicio({
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio: data.precio,
      duracionEstimada: data.duracion_estimada,
      categoria: data.categoria,
      activo: data.activo
    });
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
