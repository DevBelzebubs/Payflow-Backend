class OrdenCompra {
  constructor({ id, clienteId, total, subtotal, impuestos, estado, notas, createdAt, items }) {
    this.id = id;
    this.clienteId = clienteId;
    this.total = total;
    this.subtotal = subtotal;
    this.impuestos = impuestos;
    this.estado = estado;
    this.notas = notas;
    this.createdAt = createdAt;
    this.items = items || [];
  }

  toJSON() {
    return {
      id: this.id,
      clienteId: this.clienteId,
      total: parseFloat(this.total),
      subtotal: parseFloat(this.subtotal),
      impuestos: parseFloat(this.impuestos),
      estado: this.estado,
      notas: this.notas,
      createdAt: this.createdAt,
      items: this.items
    };
  }
}

module.exports = OrdenCompra;
