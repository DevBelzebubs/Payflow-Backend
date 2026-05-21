const axios = require('axios');
const IBcpAccountPort = require('../../../../domain/ports/outbound/IBcpAccountPort');

class BcpAccountApiClient extends IBcpAccountPort {
  constructor() {
    super();
    const bcpFullUrl = process.env.BCP_API_URL || 'http://localhost:8080/api/s2s';
    const urlObj = new URL(bcpFullUrl);
    this.bcpBaseUrl = urlObj.origin;
    this.bcpAuthUrl = `${this.bcpBaseUrl}/auth/generar-token-servicio`;
    this.bcpCuentasUrl = `${this.bcpBaseUrl}/api/s2s/cuentas`;
    this.bcpDebitoUrl = `${this.bcpBaseUrl}/api/s2s/debito/ejecutar`;
    this.tokenCache = { token: null, isFetching: false };
  }

  async _getValidToken() {
    if (this.tokenCache.token) return this.tokenCache.token;
    return await this._refreshToken();
  }

  async _refreshToken() {
    if (this.tokenCache.isFetching) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return this.tokenCache.token;
    }
    try {
      this.tokenCache.isFetching = true;
      const response = await axios.get(this.bcpAuthUrl, { timeout: 5000 });
      const newToken = response.data?.data?.token || response.data?.token;
      if (!newToken) throw new Error('BCP no devolvió un token S2S válido.');
      this.tokenCache.token = newToken;
      return newToken;
    } catch (e) {
      this.tokenCache.token = null;
      throw new Error(`No se pudo refrescar el token S2S: ${e.message}`);
    } finally {
      this.tokenCache.isFetching = false;
    }
  }

  async _sendWithRetry(config) {
    const token = await this._getValidToken();
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    try {
      return await axios(config);
    } catch (error) {
      if (error.response?.status === 401) {
        this.tokenCache.token = null;
        const newToken = await this._refreshToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        return await axios(config);
      }
      throw error;
    }
  }

  async getAccountsByDni(dni) {
    const config = { method: 'get', url: `${this.bcpCuentasUrl}/cliente/${dni}`, timeout: 5000 };
    const response = await this._sendWithRetry(config);
    const cuentas = response.data.data || response.data;
    return Array.isArray(cuentas) ? cuentas : [];
  }

  async ejecutarDebito(datos) {
    await this._sendWithRetry({
      method: 'post',
      url: this.bcpDebitoUrl,
      data: datos,
    });
  }
}

module.exports = BcpAccountApiClient;
