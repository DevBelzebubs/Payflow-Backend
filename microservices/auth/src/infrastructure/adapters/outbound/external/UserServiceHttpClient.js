const axios = require('axios');
const { resolveService } = require('../../../../../../../utils/ConsulResolver');
const IUserServiceClientPort = require('../../../../domain/ports/outbound/IUserServiceClientPort');

class UserServiceHttpClient extends IUserServiceClientPort {
  async syncBcpUser(bcpToken) {
    const usersBaseUrl = await resolveService('users-service');
    try {
      const response = await axios.post(
        `${usersBaseUrl}/api/clientes/sync`,
        {},
        { headers: { Authorization: `Bearer ${bcpToken}` } }
      );
      return response.data;
    } catch (syncError) {
      if (syncError.response && syncError.response.data) {
        throw new Error(`Error de sincronización: ${syncError.response.data.error || syncError.message}`);
      }
      throw new Error('Error al sincronizar el perfil de BCP');
    }
  }
}

module.exports = UserServiceHttpClient;
