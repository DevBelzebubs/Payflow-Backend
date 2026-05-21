const Money = require('../../../../shared/domain/value-objects/Money');

class CuentaBancaria {
  constructor({ id, clienteId, banco, numeroCuenta, tipoCuenta, titular, activo, createdAt, saldo }) {
    this.id = id;
    this.clienteId = clienteId;
    this.banco = banco;
    this.numeroCuenta = numeroCuenta;
    this.tipoCuenta = tipoCuenta;
    this.titular = titular;
    this.activo = activo !== undefined ? activo : true;
    this.createdAt = createdAt || new Date();
    this._saldo = saldo !== undefined ? (saldo instanceof Money ? saldo : new Money(saldo)) : new Money(0);
  }

  get saldo() { return this._saldo; }

  esMonederoPayflow() {
    return this.banco && this.banco.toLowerCase().includes('monedero payflow');
  }

  debitar(monto) {
    if (monto <= 0) throw new Error('El monto a debitar debe ser positivo.');
    if (!this.activo) throw new Error('La cuenta está desactivada.');

    if (this._saldo.isLessThan(new Money(monto))) {
      throw new Error('Fondos insuficientes');
    }

    this._saldo = this._saldo.subtract(new Money(monto));
    return monto;
  }

  recargar(monto) {
    if (monto <= 0) throw new Error('El monto debe ser mayor a 0.');
    this._saldo = this._saldo.add(new Money(monto));
  }

  getMaskedNumber() {
    if (!this.numeroCuenta || this.numeroCuenta.length < 4) return '****';
    return '****' + this.numeroCuenta.slice(-4);
  }

  toJSON() {
    return {
      id: this.id, clienteId: this.clienteId, banco: this.banco,
      numeroCuenta: this.getMaskedNumber(), tipoCuenta: this.tipoCuenta,
      titular: this.titular, activo: this.activo, createdAt: this.createdAt,
      saldo: this._saldo.toJSON(),
    };
  }
}

module.exports = CuentaBancaria;
