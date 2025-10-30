class BankAccountsService {
  constructor(bankAccountsRepository) {
    this.bankAccountsRepository = bankAccountsRepository;
  }

  async createCuentaBancaria(cuentaData) {
    return await this.bankAccountsRepository.createCuentaBancaria(cuentaData);
  }

  async getCuentaBancariaById(cuentaId) {
    return await this.bankAccountsRepository.findCuentaBancariaById(cuentaId);
  }

  async getCuentasByCliente(clienteId) {
    return await this.bankAccountsRepository.findCuentasByCliente(clienteId);
  }

  async updateCuentaBancaria(cuentaId, cuentaData) {
    return await this.bankAccountsRepository.updateCuentaBancaria(cuentaId, cuentaData);
  }

  async deleteCuentaBancaria(cuentaId) {
    return await this.bankAccountsRepository.deleteCuentaBancaria(cuentaId);
  }

  async deactivateCuentaBancaria(cuentaId) {
    return await this.bankAccountsRepository.updateCuentaBancaria(cuentaId, { activo: false });
  }
}

module.exports = BankAccountsService;
