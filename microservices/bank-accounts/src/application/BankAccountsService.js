const axios = require("axios");

class BankAccountsService {
  constructor(bankAccountsRepository) {
    this.bankAccountsRepository = bankAccountsRepository;
    
    const bcpFullUrl = process.env.BCP_API_URL || "http://localhost:8080/api/s2s";
    const urlObj = new URL(bcpFullUrl);
    this.bcpBaseUrl = urlObj.origin;

    this.bcpAuthUrl = `${this.bcpBaseUrl}/auth/generar-token-servicio`;
    this.bcpCuentasUrl = `${this.bcpBaseUrl}/api/s2s/cuentas`;

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
      console.log(`[BankAccountsService] Solicitando token S2S a BCP: ${this.bcpAuthUrl}`);
      
      const response = await axios.get(this.bcpAuthUrl, { timeout: 5000 });
      
      const newToken = response.data?.data?.token || response.data?.token;
      
      if (!newToken) {
        throw new Error("BCP no devolvió un token S2S válido.");
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
        this.serviceTokenCache.token = null; 
        const newToken = await this.refreshServiceToken();
        axiosConfig.headers.Authorization = `Bearer ${newToken}`;
        return await axios(axiosConfig);
      }
      throw error;
    }
  }

  async realizarDebitoInterno(clienteId, cuentaId, montoADebitar) {
    if (montoADebitar <= 0) {
      throw new Error("El monto a debitar debe ser positivo.");
    }

    const cuenta = await this.bankAccountsRepository.findCuentaParaDebito(
      cuentaId,
      clienteId
    );

    if (!cuenta) {
      throw new Error("Cuenta no encontrada o no pertenece al cliente.");
    }
    let montoFinal = montoADebitar;
    let descripcionCompra = "Compra de producto payflow";
    if (
      cuenta.banco.toLowerCase().includes("monedero payflow") &&
      cuenta.tipo_cuenta === "ahorro"
    ) {
      montoFinal = montoADebitar * 0.8;
      descripcionCompra = "Compra con Monedero Payflow (20% Dcto.)";
    }
    const saldoActual = parseFloat(cuenta.saldo);
    if (saldoActual < montoFinal) {
      throw new Error("Fondos insuficientes en la cuenta Payflow.");
    }

    const nuevoSaldo = saldoActual - montoFinal;
    await this.bankAccountsRepository.updateSaldo(cuentaId, nuevoSaldo);

    console.log(
      `[BankAccountsService] Débito exitoso: Cuenta ${cuentaId} | Saldo anterior: ${saldoActual} | Nuevo Saldo: ${nuevoSaldo}`
    );

    return {
      idPago: null,
      servicio: descripcionCompra,
      montoPagado: montoFinal,
      fecha: new Date().toISOString().split("T")[0],
      codigoAutorizacion: `PF-INT-${Date.now()}`,
    };
  }

  async getMyUnifiedAccounts(userTokenData) {
    const { userId, dni } = userTokenData;

    if (!userId) {
      throw new Error("Token inválido, no se encontró userId.");
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
    if (dni) {
      console.log(
        `[BankAccountsService] Usuario con DNI ${dni} detectado. Consultando BCP...`
      );
      const config = {
        method: "get",
        url: `${this.bcpCuentasUrl}/cliente/${dni}`,
        timeout: 5000,
      };

      bcpAccountsPromise = this.sendBcpRequestWithRetry(config)
        .then((response) => {
            const cuentas = response.data.data || response.data;
            if(Array.isArray(cuentas)){
                return cuentas.map((acc) => ({ ...acc, origen: "BCP" }));
            }
            return [];
        })
        .catch((err) => {
          console.error("Error al buscar cuentas S2S de BCP:", err.message);
          return [];
        });
    }

    const [localAccounts, bcpAccounts] = await Promise.all([
      localAccountsPromise,
      bcpAccountsPromise,
    ]);

    return [...localAccounts, ...bcpAccounts];
  }

  async recargarMonedero(userTokenData, cuentaOrigenId, monto) {
    const { clienteId, dni } = userTokenData;
    
    if (monto <= 0) throw new Error("El monto debe ser mayor a 0.");
    
    const monedero = await this.bankAccountsRepository.findMonederoByClienteId(
      clienteId
    );
    
    if (!monedero) {
      throw new Error(
        "No se encontró un Monedero Payflow activo para este usuario."
      );
    }
    
    let cuentaOrigen = null;
    try {
      cuentaOrigen = await this.bankAccountsRepository.findCuentaBancariaById(
        cuentaOrigenId
      );
    } catch (error) {}

    if (cuentaOrigen && cuentaOrigen.id === monedero.id) {
      throw new Error(
        "No puedes recargar el monedero usando el mismo monedero."
      );
    }
    const origenEsBCP = cuentaOrigen ? cuentaOrigen.banco === "BCP" : true;

    if (origenEsBCP) {
      if (!dni) throw new Error("Se requiere DNI para operar con BCP.");
      
      const numeroCuentaOrigen = cuentaOrigen ? cuentaOrigen.numeroCuenta : cuentaOrigenId;
      
      const debitoRequest = {
        dniCliente: dni,
        numeroCuentaOrigen: numeroCuentaOrigen, 
        monto: monto,
        descripcionCompra: "Recarga Payflow Wallet",
        idPagoBCP: 0,
        idServicioPayflow: "WALLET-RECHARGE"
      };

      console.log(`[BankAccountsService] Iniciando débito BCP para recarga...`);
      try {
        await this.sendBcpRequestWithRetry({
          method: "post",
          url: `${this.bcpBaseUrl}/api/s2s/debito/ejecutar`, 
          data: debitoRequest,
        });
      } catch (error) {
        throw new Error(
          `Fallo el débito en BCP: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    } else {
      if (!cuentaOrigen)
        throw new Error("Cuenta de origen Payflow no encontrada.");

      if (cuentaOrigen.saldo < monto) {
        throw new Error("Saldo insuficiente en la cuenta de origen.");
      }
      await this.bankAccountsRepository.updateSaldo(
        cuentaOrigen.id,
        cuentaOrigen.saldo - monto
      );
    }
    
    await this.bankAccountsRepository.incrementarSaldo(monedero.id, monto);
    
    return {
      mensaje: "Recarga exitosa",
      nuevoSaldo: parseFloat(monedero.saldo) + parseFloat(monto),
      monederoId: monedero.id,
    };
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