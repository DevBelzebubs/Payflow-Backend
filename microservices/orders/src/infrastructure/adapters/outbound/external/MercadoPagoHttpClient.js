const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const IMercadoPagoPort = require('../../../../domain/ports/outbound/IMercadoPagoPort');

class MercadoPagoHttpClient extends IMercadoPagoPort {
  constructor() {
    super();
    this.mpClient = new MercadoPagoConfig({
      accessToken: process.env.ACCESS_TOKEN || 'TEST-TOKEN-GENERICO',
    });
  }

  async createPreference(ordenId, descripcion, total) {
    const preference = new Preference(this.mpClient);
    const mpBody = {
      items: [{
        id: 'ORD-' + ordenId,
        title: descripcion,
        quantity: 1,
        unit_price: Number(total.toFixed(2)),
      }],
      external_reference: ordenId,
      back_urls: {
        success: 'http://localhost:3010/dashboard/history?status=success&type=cart',
        failure: 'http://localhost:3010/dashboard/payment/checkout?status=failure',
        pending: 'http://localhost:3010/dashboard/payment/checkout?status=pending',
      },
      auto_return: 'approved',
    };
    const result = await preference.create({ body: mpBody });
    return result.init_point;
  }

  async getPayment(paymentId) {
    const payment = new Payment(this.mpClient);
    return await payment.get({ id: paymentId });
  }
}

module.exports = MercadoPagoHttpClient;
