class IBcpAccountPort {
  async getAccountsByDni(dni) { throw new Error('Not implemented'); }
  async ejecutarDebito(datos) { throw new Error('Not implemented'); }
}

module.exports = IBcpAccountPort;
