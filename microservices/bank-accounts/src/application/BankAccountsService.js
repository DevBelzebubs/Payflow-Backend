const axios = require("axios");
class BankAccountsService {
  constructor(bankAccountsRepository) {
    this.bankAccountsRepository = bankAccountsRepository;
    this.bcpApiUrl = process.env.BCP_API_URL || "http://localhost:8080/api/s2s";
    this.bcpAuthUrl = (
      process.env.BCP_API_URL || "http://localhost:8080/api/s2s"
    ).replace("/api/s2s", "/auth/generar-token-servicio");

    this.serviceTokenCache = {
      token: null,
      isFetching: false,
    };
  }
  async getValidServiceToken() {
    if (this.serviceTokenCache.token) {
      return this.serviceTokenCache.token;
    }
    return await this.refreshServiceToken();
  }

  async refreshServiceToken() {
    if (this.serviceTokenCache.isFetching) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return this.serviceTokenCache.token;
    }
    try {
      this.serviceTokenCache.isFetching = true;
      console.log("[BankAccountsService] Solicitando token S2S a BCP...");
      const response = await axios.get(this.bcpAuthUrl, { timeout: 5000 });
      const newToken = response.data?.token;
      if (!newToken) {
        throw new Error("BCP no devolvió un token S2S.");
      }
      this.serviceTokenCache.token = newToken;
      return newToken;
    } catch (e) {
      console.error(
        "[BankAccountsService] CRÍTICO: Fallo al refrescar el token S2S.",
        e.message
      );
      this.serviceTokenCache.token = null;
      throw new Error(`No se pudo refrescar el token S2S: ${e.message}`);
    } finally {
      this.serviceTokenCache.isFetching = false;
    }
  }

  async sendBcpRequestWithRetry(axiosConfig) {
    try {
      const token = await this.getValidServiceToken();
      axiosConfig.headers = {
        ...axiosConfig.headers,
        Authorization: `Bearer ${token}`,
      };
      console.log(
        `[BankAccountsService] Enviando petición S2S a BCP: ${axiosConfig.url}`
      );
      return await axios(axiosConfig);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.warn(
          "[BankAccountsService] Petición S2S falló con 401. Reintentando..."
        );
        const newToken = await this.refreshServiceToken();
        axiosConfig.headers.Authorization = `Bearer ${newToken}`;
        return await axios(axiosConfig);
      }
      throw error;
    }
  }
  async getMyUnifiedAccounts(userTokenData) {
    const { userId, dni, userType } = userTokenData;

    if (!userId || !userType) {
      throw new Error("Token inválido, no se encontró userId o userType.");
    }

    const localAccountsPromise = this.bankAccountsRepository
      .findCuentasByUsuarioId(userId)
      .then((accounts) =>
        accounts.map((acc) => ({ ...acc.toJSON(), origen: "PAYFLOW" }))
      )
      .catch((err) => {
        console.error(
          "Error al buscar cuentas locales de Payflow:",
          err.message
        );
        return [];
      });

    let bcpAccountsPromise = Promise.resolve([]);

    if (userType === "BCP") {
      if (!dni) throw new Error("Usuario BCP sin DNI en el token.");

      console.log(
        `[BankAccountsService] Es usuario BCP, consultando cuentas S2S para DNI...`
      );
      const config = {
        method: "get",
        url: `${this.bcpApiUrl}/cuentas/cliente/${dni}`,
        timeout: 5000,
      };

      bcpAccountsPromise = this.sendBcpRequestWithRetry(config)
        .then((response) =>
          response.data.map((acc) => ({ ...acc, origen: "BCP" }))
        )
        .catch((err) => {
          console.error("Error al buscar cuentas S2S de BCP:", err.message);
          return []; // No fallar la llamada completa si BCP falla
        });
    }

    // 3. Combinar resultados
    const [localAccounts, bcpAccounts] = await Promise.all([
      localAccountsPromise,
      bcpAccountsPromise,
    ]);

    return [...localAccounts, ...bcpAccounts];
  }
  async createCuentaBancaria(cuentaData) {
    return await this.bankAccountsRepository.createCuentaBancaria(cuentaData);
  }

  async getCuentaBancariaById(cuentaId) {
    return await this.bankAccountsRepository.findCuentaBancariaById(cuentaId);
  }

  async getCuentasByCliente(clienteId) {
    return await this.bankAccountsRepository.findCuentasByCliente(clienteId);
  }

  async updateCuentaBancaria(cuentaId, cuentaData) {
    return await this.bankAccountsRepository.updateCuentaBancaria(
      cuentaId,
      cuentaData
    );
  }

  async deleteCuentaBancaria(cuentaId) {
    return await this.bankAccountsRepository.deleteCuentaBancaria(cuentaId);
  }

  async deactivateCuentaBancaria(cuentaId) {
    return await this.bankAccountsRepository.updateCuentaBancaria(cuentaId, {
      activo: false,
    });
  }
}

module.exports = BankAccountsService;
