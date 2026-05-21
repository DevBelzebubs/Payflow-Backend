const axios = require('axios');
const IBcpPaymentPort = require('../../../../domain/ports/outbound/IBcpPaymentPort');

class BcpPaymentApiClient extends IBcpPaymentPort {
  constructor() {
    super();
    this.bcpApiUrl = process.env.BCP_API_URL || 'http://localhost:8080/api/s2s';
    this.bcpAuthUrl = this.bcpApiUrl.replace('/api/s2s', '/auth/generar-token-servicio');
    this.PAYFLOW_MASTER_ACCOUNT_BCP = 'CUENTA-MAESTRA-PAYFLOW-001';
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
      this.tokenCache.token = response.data?.token;
      return this.tokenCache.token;
    } catch (e) {
      this.tokenCache.token = null;
      console.warn(`[BcpPaymentApiClient] No se pudo obtener token BCP: ${e.message}`);
      return null;
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
        const newToken = await this._refreshToken();
        config.headers.Authorization = `Bearer ${newToken}`;
        return await axios(config);
      }
      throw error;
    }
  }

  async ejecutarDebito(datos) {
    const { dniCliente, numeroCuentaOrigen, monto, descripcionCompra, esServicioBCP, idPagoBCP, idServicioPayflow } = datos;
    const debitoRequest = { dniCliente, numeroCuentaOrigen, monto, descripcionCompra };
    if (esServicioBCP) {
      debitoRequest.idPagoBCP = idPagoBCP;
      debitoRequest.idServicioPayflow = idServicioPayflow;
    }
    const url = esServicioBCP
      ? `${this.bcpApiUrl}/pagos/solicitar-debito`
      : `${this.bcpApiUrl}/debito/ejecutar`;
    const bcpRes = await this._sendWithRetry({ method: 'post', url, data: debitoRequest });
    return bcpRes.data;
  }

  async liquidarDeuda(pagoId) {
    const payload = { cuentaId: this.PAYFLOW_MASTER_ACCOUNT_BCP, PagoId: pagoId };
    await axios.post(`${this.bcpApiUrl}/pagos/realizar`, payload);
  }
}

module.exports = BcpPaymentApiClient;
