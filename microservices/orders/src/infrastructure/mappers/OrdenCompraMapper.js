const OrdenCompra = require('../../domain/models/OrdenCompra');

class OrdenCompraMapper {
  static toDomain(data) {
    if (!data) return null;
    return new OrdenCompra({
      id: data.id,
      clienteId: data.cliente_id || data.clienteId,
      total: data.total,
      subtotal: data.subtotal,
      impuestos: data.impuestos,
      estado: data.estado,
      notas: data.notas,
      createdAt: data.created_at || data.createdAt,
      items: data.items || [],
    });
  }

  static toPersistence(orden) {
    return {
      cliente_id: orden.clienteId,
      total: orden.total.toFloat(),
      subtotal: orden.subtotal.toFloat(),
      impuestos: orden.impuestos.toFloat(),
      estado: orden.estado,
      notas: orden.notas,
    };
  }
}

module.exports = OrdenCompraMapper;
