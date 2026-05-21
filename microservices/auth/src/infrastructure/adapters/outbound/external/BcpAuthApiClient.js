const axios = require('axios');
const IBcpAuthClientPort = require('../../../../domain/ports/outbound/IBcpAuthClientPort');

class BcpAuthApiClient extends IBcpAuthClientPort {
  constructor() {
    super();
    this.bcpRootUrl = process.env.BCP_ROOT_URL || 'http://localhost:8080';
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${this.bcpRootUrl}/auth/login`, {
        nombre: email,
        contrasena: password,
      });
      const bcpToken = response.data?.data?.token;
      if (!bcpToken) {
        throw new Error('BCP no devolvió un token');
      }
      return bcpToken;
    } catch (error) {
      throw new Error('Credenciales inválidas (BCP)');
    }
  }
}

module.exports = BcpAuthApiClient;
