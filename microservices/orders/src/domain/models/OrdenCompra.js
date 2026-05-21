const Money = require('../../../../shared/domain/value-objects/Money');

class OrdenCompra {
  static ESTADOS = { PENDIENTE: 'pendiente', CONFIRMADA: 'confirmada', COMPLETADA: 'completada', CANCELADA: 'cancelada' };

  constructor({ id, clienteId, total, subtotal, impuestos, estado, notas, createdAt, items }) {
    this.id = id;
    this.clienteId = clienteId;
    this.total = total instanceof Money ? total : new Money(total);
    this.subtotal = subtotal instanceof Money ? subtotal : new Money(subtotal);
    this.impuestos = impuestos instanceof Money ? impuestos : new Money(impuestos);
    this.estado = estado || OrdenCompra.ESTADOS.PENDIENTE;
    this.notas = notas || '';
    this.createdAt = createdAt || new Date();
    this.items = items || [];
  }

  confirmar() {
    if (this.estado !== OrdenCompra.ESTADOS.PENDIENTE) {
      throw new Error(`No se puede confirmar una orden en estado: ${this.estado}`);
    }
    this.estado = OrdenCompra.ESTADOS.CONFIRMADA;
  }

  completar() {
    this.estado = OrdenCompra.ESTADOS.COMPLETADA;
  }

  cancelar() {
    if (this.estado === OrdenCompra.ESTADOS.COMPLETADA) {
      throw new Error('No se puede cancelar una orden completada');
    }
    this.estado = OrdenCompra.ESTADOS.CANCELADA;
  }

  estaPendiente() { return this.estado === OrdenCompra.ESTADOS.PENDIENTE; }
  estaConfirmada() { return this.estado === OrdenCompra.ESTADOS.CONFIRMADA; }
  estaCompletada() { return this.estado === OrdenCompra.ESTADOS.COMPLETADA; }

  agregarItem(item) {
    this.items.push(item);
    this.subtotal = this.subtotal.add(new Money(item.subtotal));
    this.impuestos = this.subtotal.multiply(0.18);
    this.total = this.subtotal.add(this.impuestos);
  }

  toJSON() {
    return {
      id: this.id, clienteId: this.clienteId,
      total: this.total.toJSON(), subtotal: this.subtotal.toJSON(),
      impuestos: this.impuestos.toJSON(), estado: this.estado,
      notas: this.notas, createdAt: this.createdAt, items: this.items,
    };
  }
}

module.exports = OrdenCompra;
