const axios = require('axios');
const { resolveService } = require('../../../../../../../utils/ConsulResolver');
const IBankAccountServicePort = require('../../../../domain/ports/outbound/IBankAccountServicePort');

class BankAccountServiceHttpClient extends IBankAccountServicePort {
  async createWallet(clienteId, usuarioId, titular) {
    const bankAccountBaseUrl = await resolveService('bank-accounts-service');
    const walletData = {
      cliente_id: clienteId,
      banco: 'Monedero Payflow',
      numero_cuenta: `WALLET-${usuarioId.substring(0, 8)}`,
      tipo_cuenta: 'ahorro',
      titular,
      activo: true,
    };
    await axios.post(`${bankAccountBaseUrl}/api/cuentas-bancarias`, walletData);
  }
}

module.exports = BankAccountServiceHttpClient;
