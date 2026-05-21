class IBankAccountsRepositoryPort {
  async createCuentaBancaria(data) { throw new Error('Not implemented'); }
  async findCuentaBancariaById(id) { throw new Error('Not implemented'); }
  async findCuentasByCliente(clienteId) { throw new Error('Not implemented'); }
  async findCuentasByUsuarioId(userId) { throw new Error('Not implemented'); }
  async findCuentaParaDebito(cuentaId, clienteId) { throw new Error('Not implemented'); }
  async findMonederoByClienteId(clienteId) { throw new Error('Not implemented'); }
  async updateCuentaBancaria(id, data) { throw new Error('Not implemented'); }
  async deleteCuentaBancaria(id) { throw new Error('Not implemented'); }
  async updateSaldo(cuentaId, nuevoSaldo) { throw new Error('Not implemented'); }
  async incrementarSaldo(cuentaId, monto) { throw new Error('Not implemented'); }
}

module.exports = IBankAccountsRepositoryPort;
