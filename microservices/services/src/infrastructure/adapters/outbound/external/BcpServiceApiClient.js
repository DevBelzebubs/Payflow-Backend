const axios = require('axios');
const IBcpServiceClientPort = require('../../../../domain/ports/outbound/IBcpServiceClientPort');
const BcpServicioMapper = require('../../../mappers/BcpServicioMapper');

class BcpServiceApiClient extends IBcpServiceClientPort {
  constructor() {
    super();
    const bcpFullUrl = process.env.BCP_API_URL || 'http://localhost:8080/api/s2s';
    const urlObj = new URL(bcpFullUrl);
    this.bcpBaseUrl = urlObj.origin;
    this.bcpAuthUrl = `${this.bcpBaseUrl}/auth/generar-token-servicio`;
    this.bcpPagosUrl = `${this.bcpBaseUrl}/api/pagos`;
    this.tokenCache = { token: null, isFetching: false };
  }

  async _getValidToken() {
    if (this.tokenCache.token) return this.tokenCache.token;
    return await this._refreshServiceToken();
  }

  async _refreshServiceToken() {
    if (this.tokenCache.isFetching) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return this.tokenCache.token;
    }
    try {
      this.tokenCache.isFetching = true;
      const response = await axios.get(this.bcpAuthUrl, { timeout: 5000 });
      const newToken = response.data?.data?.token || response.data?.token;
      if (!newToken) throw new Error('BCP no devolvi\u00f3 un token S2S v\u00e1lido');
      this.tokenCache.token = newToken;
      return newToken;
    } catch (e) {
      this.tokenCache.token = null;
      throw e;
    } finally {
      this.tokenCache.isFetching = false;
    }
  }

  async getPendingDebts(dni, clienteId) {
    const token = await this._getValidToken();
    const urlConsulta = `${this.bcpPagosUrl}/pendientes/usuario/${dni}`;
    const response = await axios.get(urlConsulta, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const deudasBCP = response.data.data || response.data;
    return deudasBCP.map(deuda => BcpServicioMapper.toPendingDebt(deuda, clienteId));
  }

  async getMisDeudas(dni) {
    const token = await this._getValidToken();
    const urlConsulta = `${this.bcpPagosUrl}/pendientes/usuario/${dni}`;
    const response = await axios.get(urlConsulta, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const datos = response.data.data || response.data;
    if (!Array.isArray(datos)) return [];
    return datos.map(pago => BcpServicioMapper.toMisDeudas(pago));
  }
}

module.exports = BcpServiceApiClient;
