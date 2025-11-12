class CuentaBancaria {
  constructor({ id, clienteId, banco, numeroCuenta, tipoCuenta, titular, activo, createdAt,saldo }) {
    this.id = id;
    this.clienteId = clienteId;
    this.banco = banco;
    this.numeroCuenta = numeroCuenta;
    this.tipoCuenta = tipoCuenta;
    this.titular = titular;
    this.activo = activo;
    this.createdAt = createdAt;
    this.saldo = saldo;
  }

  getMaskedNumber() {
    if (!this.numeroCuenta || this.numeroCuenta.length < 4) {
      return '****';
    }
    return '****' + this.numeroCuenta.slice(-4);
  }

  toJSON() {
    return {
      id: this.id,
      clienteId: this.clienteId,
      banco: this.banco,
      numeroCuenta: this.getMaskedNumber(),
      tipoCuenta: this.tipoCuenta,
      titular: this.titular,
      activo: this.activo,
      createdAt: this.createdAt,
      saldo: this.saldo
    };
  }
}

module.exports = CuentaBancaria;
