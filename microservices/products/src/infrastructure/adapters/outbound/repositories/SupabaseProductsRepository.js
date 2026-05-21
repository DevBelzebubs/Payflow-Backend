const IProductsRepositoryPort = require('../../../../domain/ports/outbound/IProductsRepositoryPort');
const ProductoMapper = require('../../../mappers/ProductoMapper');

class SupabaseProductsRepository extends IProductsRepositoryPort {
  constructor(supabaseClient) {
    super();
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

    return ProductoMapper.toDomain(data);
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

    return ProductoMapper.toDomain(data);
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

    return data.map(item => ProductoMapper.toDomain(item));
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

    return ProductoMapper.toDomain(data);
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

  async addProductImages(productoId, urlList) {
    const rows = urlList.map((url, index) => ({
      producto_id: productoId,
      url_imagen: url,
      orden: index,
    }));

    const { error } = await this.supabase
      .from('producto_imagenes')
      .insert(rows);

    if (error) {
      throw new Error(`Error insertando imágenes de galería: ${error.message}`);
    }

    return true;
  }
}

module.exports = SupabaseProductsRepository;
