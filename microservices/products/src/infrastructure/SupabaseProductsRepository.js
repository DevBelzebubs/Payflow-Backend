const Producto = require('../domain/Producto');

class SupabaseProductsRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async createProducto(productoData) {
    const { data, error } = await this.supabase
      .from('productos')
      .insert([productoData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando producto: ${error.message}`);
    }

    return new Producto(data);
  }

  async findProductoById(productoId) {
    const { data, error } = await this.supabase
      .from('productos')
      .select('*')
      .eq('id', productoId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error buscando producto: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return new Producto(data);
  }

  async findAllProductos(filters = {}) {
    let query = this.supabase.from('productos').select('*');

    if (filters.activo !== undefined) {
      query = query.eq('activo', filters.activo);
    }

    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error obteniendo productos: ${error.message}`);
    }

    return data.map(item => new Producto(item));
  }

  async updateProducto(productoId, productoData) {
    const { data, error } = await this.supabase
      .from('productos')
      .update(productoData)
      .eq('id', productoId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando producto: ${error.message}`);
    }

    return new Producto(data);
  }

  async deleteProducto(productoId) {
    const { error } = await this.supabase
      .from('productos')
      .delete()
      .eq('id', productoId);

    if (error) {
      throw new Error(`Error eliminando producto: ${error.message}`);
    }

    return true;
  }
}

module.exports = SupabaseProductsRepository;
