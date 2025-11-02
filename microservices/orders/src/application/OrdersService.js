const axios = require("axios");

class OrdersService {
  constructor(ordersRepository) {
    this.ordersRepository = ordersRepository;
    this.productsServiceUrl =
      process.env.PRODUCTS_SERVICE_URL || "http://localhost:3003";
    this.servicesServiceUrl =
      process.env.SERVICES_SERVICE_URL || "http://localhost:3004";

    this.bcpApiUrl = process.env.BCP_API_URL || "http://localhost:8080/api/s2s";
    this.bcpAuthUrl = (process.env.BCP_API_URL || "http://localhost:8080/api/s2s")
      .replace("/api/s2s", "/auth/generar-token-servicio");

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
      await new Promise(resolve => setTimeout(resolve, 200));
      return this.serviceTokenCache.token;
    }

    try {
      this.serviceTokenCache.isFetching = true;
      console.log("[OrdersService] Token S2S no encontrado o expirado. Solicitando uno nuevo a BCP...");
      
      const response = await axios.get(this.bcpAuthUrl, { timeout: 5000 });
      const newToken = response.data?.token;

      if (!newToken) {
        throw new Error("La respuesta de BCP /auth/generar-token-servicio no contenía un token.");
      }

      this.serviceTokenCache.token = newToken;
      console.log("[OrdersService] Nuevo token S2S obtenido y cacheado.");
      return newToken;

    } catch (e) {
      console.error("[OrdersService] CRÍTICO: Fallo al intentar refrescar el token S2S.", e.message);
      this.serviceTokenCache.token = null;
      throw new Error(`No se pudo refrescar el token de servicio S2S desde BCP: ${e.message}`);
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
      
      console.log(`[OrdersService] Enviando petición S2S a BCP: ${axiosConfig.url}`);
      return await axios(axiosConfig);

    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.warn("[OrdersService] Petición S2S falló con 401 (Token Expirado). Reintentando con un token nuevo...");
        
        const newToken = await this.refreshServiceToken();
        
        axiosConfig.headers.Authorization = `Bearer ${newToken}`;
        console.log(`[OrdersService] Reintentando petición S2S a BCP: ${axiosConfig.url}`);
        return await axios(axiosConfig);
      }
      
      throw error;
    }
  }


  async createOrden(ordenData, pagoBcp) {
    try {
      const testUrl = (process.env.BCP_API_URL || "http://localhost:8080/api/s2s").replace("/api/s2s", "");
      await axios.get(`${testUrl}/auth/generar-token-servicio`, { timeout: 3000 });
      console.log("[OrdersService] ¡ÉXITO! La conexión de Node.js a Java (8080) funciona.");
    } catch (e) {
      console.error(`[OrdersService] ¡FALLO DE RED! Node.js NO PUEDE conectarse a Java en el puerto 8080. Error: ${e.message}`);
      throw new Error(`Fallo de red al conectar con BCP: ${e.message}. Revisa el Firewall.`);
    }

    const { clienteId, items, notas } = ordenData;

    let subtotal = 0;
    let servicioIdParaPagar = null;

    for (const item of items) {
      let precio = 0;

      if (item.productoId) {
        const response = await axios.get(
          `${this.productsServiceUrl}/api/productos/${item.productoId}`
        );
        precio = response.data.precio;
      } else if (item.servicioId) {
        const response = await axios.get(
          `${this.servicesServiceUrl}/api/servicios/${item.servicioId}`
        );
        precio = response.data.recibo;
        servicioIdParaPagar = item.servicioId;
      }

      item.precioUnitario = precio;
      item.subtotal = precio * item.cantidad;
      subtotal += item.subtotal;
    }

    const impuestos = subtotal * 0.16;
    const total = subtotal + impuestos;

    const debitoRequest = {
      dniCliente: pagoBcp.dniCliente,
      numeroCuentaOrigen: pagoBcp.numeroCuentaOrigen,
      monto: subtotal,
      idPagoBCP: pagoBcp.idPagoBCP,
      idServicioPayflow: servicioIdParaPagar,
    };

    let comprobanteBcp;
    try {
      console.log("[OrdersService] Enviando solicitud de débito a BCP (Java) con reintento...");

      const config = {
        method: 'post',
        url: `${this.bcpApiUrl}/pagos/solicitar-debito`,
        data: debitoRequest,
        timeout: 10000, 
      };

      const bcpResponse = await this.sendBcpRequestWithRetry(config);
      
      comprobanteBcp = bcpResponse.data;
      console.log("[OrdersService] BCP confirmó el débito.");
      
    } catch (error) {
      console.error("--- ¡ERROR EN LA LLAMADA S2S A BCP! ---");

      if (error.code === "ECONNABORTED") {
        console.error("Error: Timeout. El servidor de BCP (Java) en 8080 no respondió a tiempo.");
        throw new Error("Timeout: El servidor de BCP (Java) no respondió a tiempo. ¿Está corriendo y sin errores?");
      }
      if (error.response) {
        if (error.response.status === 401) {
          console.error("¡FALLO PERMANENTE! BCP rechazó el token S2S incluso después de refrescarlo.");
          throw new Error("Error en la pasarela BCP: Autenticación S2S fallida permanentemente.");
        }
        
        console.error("BCP respondió con error:", error.response.status, error.response.data);
        throw new Error(
          `Error en la pasarela BCP: ${JSON.stringify(error.response.data)}`
        );
      }
      console.error("Error de red llamando a BCP:", error.message);
      throw new Error(`Error de red llamando a BCP: ${error.message}`);
    }

    const orden = await this.ordersRepository.createOrden({
      cliente_id: clienteId,
      total,
      subtotal,
      impuestos,
      estado: "CONFIRMADA",
      notas,
    });

    for (const item of items) {
      await this.ordersRepository.createItemOrden({
        orden_id: orden.id,
        producto_id: item.productoId || null,
        servicio_id: item.servicioId || null,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        subtotal: item.subtotal,
      });

      if (item.servicioId) {
        try {
          await axios.patch(
            `${this.servicesServiceUrl}/api/servicios/${item.servicioId}/marcar-pagado`
          );
          console.log(
            `[OrdersService] Servicio Payflow ${item.servicioId} marcado como PAGADO.`
          );
        } catch (e) {
          console.error(
            `[OrdersService] Error al marcar servicio ${item.servicioId} como pagado: ${e.message}`
          );
        }
      }
    }

    const ordenCompleta = await this.getOrdenById(orden.id);
    return {
      ordenPayflow: ordenCompleta.toJSON(),
      comprobanteBCP: comprobanteBcp,
    };
  }
  
  async getOrdenById(ordenId) {
    return await this.ordersRepository.findOrdenById(ordenId);
  }

  async getOrdenesByCliente(clienteId) {
    return await this.ordersRepository.findOrdenesByCliente(clienteId);
  }

  async getAllOrdenes() {
    return await this.ordersRepository.findAllOrdenes();
  }

  async updateOrdenEstado(ordenId, nuevoEstado) {
    return await this.ordersRepository.updateOrden(ordenId, {
      estado: nuevoEstado,
    });
  }

  async cancelOrden(ordenId) {
    const orden = await this.ordersRepository.findOrdenById(ordenId);

    if (!orden) {
      throw new Error("Orden no encontrada");
    }

    if (orden.estado === "completada") {
      throw new Error("No se puede cancelar una orden completada");
    }

    for (const item of orden.items) {
      if (item.producto_id) {
        await axios.patch(
          `${this.productsServiceUrl}/api/productos/${item.producto_id}/stock`,
          {
            cantidad: item.cantidad,
          }
        );
      }
    }

    return await this.ordersRepository.updateOrden(ordenId, {
      estado: "cancelada",
    });
  }
}

module.exports = OrdersService;