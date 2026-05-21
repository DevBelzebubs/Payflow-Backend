class IBcpPaymentPort {
  async ejecutarDebito(datos) { throw new Error('Not implemented'); }
  async liquidarDeuda(idPagoBCP) { throw new Error('Not implemented'); }
}

module.exports = IBcpPaymentPort;
