const OrdenCompra = require('../domain/OrdenCompra');

class SupabaseOrdersRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async createOrden(ordenData) {
    const { data, error } = await this.supabase
      .from('ordenes_compra')
      .insert([ordenData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando orden: ${error.message}`);
    }

    return new OrdenCompra({
      id: data.id,
      clienteId: data.cliente_id,
      total: data.total,
      subtotal: data.subtotal,
      impuestos: data.impuestos,
      estado: data.estado,
      notas: data.notas,
      createdAt: data.created_at
    });
  }

  async createItemOrden(itemData) {
    const { error } = await this.supabase
      .from('items_orden')
      .insert([itemData]);

    if (error) {
      throw new Error(`Error creando item de orden: ${error.message}`);
    }

    return true;
  }

  async findOrdenById(ordenId) {
    const { data, error } = await this.supabase
      .from('ordenes_compra')
      .select('*, items_orden(*)')
      .eq('id', ordenId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error buscando orden: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return new OrdenCompra({
      id: data.id,
      clienteId: data.cliente_id,
      total: data.total,
      subtotal: data.subtotal,
      impuestos: data.impuestos,
      estado: data.estado,
      notas: data.notas,
      createdAt: data.created_at,
      items: data.items_orden
    });
  }

  async findOrdenesByCliente(clienteId) {
    const { data, error } = await this.supabase
      .from('ordenes_compra')
      .select('*, items_orden(*)')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error buscando ordenes: ${error.message}`);
    }

    return data.map(item => new OrdenCompra({
      id: item.id,
      clienteId: item.cliente_id,
      total: item.total,
      subtotal: item.subtotal,
      impuestos: item.impuestos,
      estado: item.estado,
      notas: item.notas,
      createdAt: item.created_at,
      items: item.items_orden
    }));
  }

  async findAllOrdenes() {
    const { data, error } = await this.supabase
      .from('ordenes_compra')
      .select('*, items_orden(*)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error obteniendo ordenes: ${error.message}`);
    }

    return data.map(item => new OrdenCompra({
      id: item.id,
      clienteId: item.cliente_id,
      total: item.total,
      subtotal: item.subtotal,
      impuestos: item.impuestos,
      estado: item.estado,
      notas: item.notas,
      createdAt: item.created_at,
      items: item.items_orden
    }));
  }

  async updateOrden(ordenId, ordenData) {
    const { data, error } = await this.supabase
      .from('ordenes_compra')
      .update(ordenData)
      .eq('id', ordenId)
      .select('*, items_orden(*)')
      .single();

    if (error) {
      throw new Error(`Error actualizando orden: ${error.message}`);
    }

    return new OrdenCompra({
      id: data.id,
      clienteId: data.cliente_id,
      total: data.total,
      subtotal: data.subtotal,
      impuestos: data.impuestos,
      estado: data.estado,
      notas: data.notas,
      createdAt: data.created_at,
      items: data.items_orden
    });
  }
}

module.exports = SupabaseOrdersRepository;
