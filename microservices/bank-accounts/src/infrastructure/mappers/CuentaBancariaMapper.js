const CuentaBancaria = require('../../domain/models/CuentaBancaria');

class CuentaBancariaMapper {
  static toDomain(data) {
    if (!data) return null;
    return new CuentaBancaria({
      id: data.id,
      clienteId: data.cliente_id || data.clienteId,
      banco: data.banco,
      numeroCuenta: data.numero_cuenta || data.numeroCuenta,
      tipoCuenta: data.tipo_cuenta || data.tipoCuenta,
      titular: data.titular,
      activo: data.activo,
      createdAt: data.created_at || data.createdAt,
      saldo: data.saldo,
    });
  }

  static toPersistence(cuenta) {
    return {
      cliente_id: cuenta.clienteId,
      banco: cuenta.banco,
      numero_cuenta: cuenta.numeroCuenta,
      tipo_cuenta: cuenta.tipoCuenta,
      titular: cuenta.titular,
      activo: cuenta.activo,
      saldo: cuenta._saldo.toFloat(),
    };
  }
}

module.exports = CuentaBancariaMapper;
