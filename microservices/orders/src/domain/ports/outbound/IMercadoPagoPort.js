class IMercadoPagoPort {
  async createPreference(ordenId, descripcion, total) { throw new Error('Not implemented'); }
  async getPayment(paymentId) { throw new Error('Not implemented'); }
}

module.exports = IMercadoPagoPort;
