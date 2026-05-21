const axios = require('axios');
const { resolveService } = require('../../../../../../../utils/ConsulResolver');
const IBankAccountServicePort = require('../../../../domain/ports/outbound/IBankAccountServicePort');

class BankAccountServiceHttpClient extends IBankAccountServicePort {
  async debitar(cuentaId, monto, userToken) {
    const baseUrl = await resolveService('bank-accounts-service');
    const headers = {};
    if (userToken) headers.Authorization = userToken;
    await axios.post(`${baseUrl}/api/cuentas-bancarias/debitar`, { cuentaId, monto }, { headers });
  }
}

module.exports = BankAccountServiceHttpClient;
