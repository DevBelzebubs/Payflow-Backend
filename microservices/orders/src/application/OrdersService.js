const axios = require("axios");
const { MercadoPagoConfig, Preference } = require('mercadopago');
const client = new MercadoPagoConfig({ accessToken: 'ACCESS_TOKEN' });

class OrdersService {
  constructor(ordersRepository) {
    this.ordersRepository = ordersRepository;
    this.productsServiceUrl =
      process.env.PRODUCTS_SERVICE_URL || "http://localhost:3003";
    this.servicesServiceUrl =
      process.env.SERVICES_SERVICE_URL || "http://localhost:3004";
    this.bankAccountsServiceUrl =
      process.env.BANK_ACCOUNTS_SERVICE_URL || "http://localhost:3006";
    this.bcpApiUrl = process.env.BCP_API_URL || "http://localhost:8080/api/s2s";
    this.bcpAuthUrl = (
      process.env.BCP_API_URL || "http://localhost:8080/api/s2s"
    ).replace("/api/s2s", "/auth/generar-token-servicio");

    this.serviceTokenCache = {
      token: null,
      isFetching: false,
    };
    this.PAYFLOW_MASTER_ACCOUNT_BCP = "CUENTA-MAESTRA-PAYFLOW-001"
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
      console.log(
        "[OrdersService] Token S2S no encontrado o expirado. Solicitando uno nuevo a BCP..."
      );

      const response = await axios.get(this.bcpAuthUrl, { timeout: 5000 });
      const newToken = response.data?.token;

      if (!newToken) {
        throw new Error(
          "La respuesta de BCP /auth/generar-token-servicio no contenía un token."
        );
      }

      this.serviceTokenCache.token = newToken;
      console.log("[OrdersService] Nuevo token S2S obtenido y cacheado.");
      return newToken;
    } catch (e) {
      console.error(
        "[OrdersService] CRÍTICO: Fallo al intentar refrescar el token S2S.",
        e.message
      );
      this.serviceTokenCache.token = null;
      throw new Error(
        `No se pudo refrescar el token de servicio S2S desde BCP: ${e.message}`
      );
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
        `[OrdersService] Enviando petición S2S a BCP: ${axiosConfig.url}`
      );
      return await axios(axiosConfig);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.warn(
          "[OrdersService] Petición S2S falló con 401 (Token Expirado). Reintentando con un token nuevo..."
        );

        const newToken = await this.refreshServiceToken();

        axiosConfig.headers.Authorization = `Bearer ${newToken}`;
        console.log(
          `[OrdersService] Reintentando petición S2S a BCP: ${axiosConfig.url}`
        );
        return await axios(axiosConfig);
      }

      throw error;
    }
  }

  async createOrden(ordenData, datosPago) {
    try {
      const testUrl = (
        process.env.BCP_API_URL || "http://localhost:8080/api/s2s"
      ).replace("/api/s2s", "");
      await axios.get(`${testUrl}/auth/generar-token-servicio`, {
        timeout: 3000,
      });
      console.log(
        "[OrdersService] ¡ÉXITO! La conexión de Node.js a Java (8080) funciona."
      );
    } catch (e) {
      console.error(
        `[OrdersService] ¡FALLO DE RED! Node.js NO PUEDE conectarse a Java en el puerto 8080. Error: ${e.message}`
      );
      throw new Error(
        `Fallo de red al conectar con BCP: ${e.message}. Revisa el Firewall.`
      );
    }

    const { clienteId, items, notas } = ordenData;
    const mainItem = items[0];

    let esProductoPayflow = !!mainItem.productoId;
    let esServicioBCP = !!mainItem.servicioId && !!datosPago.idPagoBCP;

    let subtotal = 0;
    let servicioIdParaPagar = null;
    let descripcionCompra = "Compra en Payflow";
    if (datosPago.origen === 'MERCADOPAGO') {
       const orden = await this.ordersRepository.createOrden({
           ...ordenData,
           estado: 'PENDIENTE_PAGO'
       });
       const preference = new Preference(client);
       const result = await preference.create({
        body:{
          items: ordenData.items.map(item => ({
            title: `Producto/Servicio ${item.id}`,
            quantity: item.cantidad,
            unit_price: Number(item.precioUnitario)
          })),
          external_reference: orden.id,
          back_urls:{
            success: "http://localhost:3000/dashboard/history?status=success",
            failure: "http://localhost:3000/dashboard/payment/checkout?status=failure",
            pending: "http://localhost:3000/dashboard/payment/checkout?status=pending"
          }
        }
       });
       return {
        ordenPayflow: orden.toJSON(),
        urlPago: result.init_point,
        modo : 'REDIRECT'
       }
      }
    if (esServicioBCP) {
      if (!datosPago.monto) {
        throw new Error(
          "Para pagos de servicios BCP, 'datosPago.monto' es requerido (Error de Servicio)."
        );
      }
      subtotal = datosPago.monto;
      servicioIdParaPagar = mainItem.servicioId;
      descripcionCompra = `1x Servicio BCP (ID: ${mainItem.servicioId})`;

      mainItem.precioUnitario = subtotal / mainItem.cantidad;
      mainItem.subtotal = subtotal;
    } else {
      for (const item of items) {
        let precio = 0;
        if (item.productoId) {
          const response = await axios.get(
            `${this.productsServiceUrl}/api/productos/${item.productoId}`
          );
          precio = response.data.precio;
          descripcionCompra = `1x Producto Payflow (ID: ${item.productoId})`;
        } else if (item.servicioId) {
          const response = await axios.get(
            `${this.servicesServiceUrl}/api/servicios/${item.servicioId}`
          );
          precio = response.data.recibo;
          servicioIdParaPagar = item.servicioId;
          descripcionCompra = `1x Servicio Payflow (ID: ${item.servicioId})`;
        }

        item.precioUnitario = precio;
        item.subtotal = precio * item.cantidad;
        subtotal += item.subtotal;
      }
    }

    const impuestos = subtotal * 0.16;
    const total = subtotal + impuestos;

    let comprobante;

    if (datosPago.origen === "BCP") {
      console.log("[OrdersService] Procesando pago vía BCP S2S...");
      let configS2S;
      if (esServicioBCP) {
        console.log(
          `[OrdersService] Pagando servicio BCP (idPagoBCP: ${datosPago.idPagoBCP})`
        );
        const debitoRequest = {
          dniCliente: datosPago.dniCliente,
          numeroCuentaOrigen: datosPago.numeroCuentaOrigen,
          monto: total,
          idPagoBCP: datosPago.idPagoBCP,
          idServicioPayflow: servicioIdParaPagar,
        };
        configS2S = {
          method: "post",
          url: `${this.bcpApiUrl}/pagos/solicitar-debito`,
          data: debitoRequest,
          timeout: 10000,
        };
      } else if (esProductoPayflow) {
        console.log(
          `[OrdersService] Ejecutando débito directo BCP para compra Payflow`
        );
        const debitoDirectoRequest = {
          dniCliente: datosPago.dniCliente,
          numeroCuentaOrigen: datosPago.numeroCuentaOrigen,
          monto: subtotal,
          descripcionCompra: descripcionCompra,
        };
        configS2S = {
          method: "post",
          url: `${this.bcpApiUrl}/debito/ejecutar`,
          data: debitoDirectoRequest,
          timeout: 10000,
        };
      } else {
        console.log(
          `[OrdersService] Ejecutando débito directo BCP para servicio Payflow`
        );
        const debitoDirectoRequest = {
          dniCliente: datosPago.dniCliente,
          numeroCuentaOrigen: datosPago.numeroCuentaOrigen,
          monto: subtotal,
          descripcionCompra: descripcionCompra,
        };
        configS2S = {
          method: "post",
          url: `${this.bcpApiUrl}/debito/ejecutar`,
          data: debitoDirectoRequest,
          timeout: 10000,
        };
      }
      try {
        const bcpResponse = await this.sendBcpRequestWithRetry(configS2S);
        comprobante = bcpResponse.data;
        console.log("[OrdersService] BCP confirmó el débito.");
      } catch (error) {
        console.error("--- ¡ERROR EN LA LLAMADA S2S A BCP! ---");
        const errorMsg = error.response
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new Error(`Error en la pasarela BCP: ${errorMsg}`);
      }
    } else if (datosPago.origen === "PAYFLOW") {
      try {
        const debitResponse = await axios.post(
          `${this.bankAccountsServiceUrl}/api/cuentas-bancarias/debitar`,
          {
            cuentaId: datosPago.cuentaId,
            monto: total,
          },
          {
            headers: { Authorization: datosPago.userToken },
          }
        );
        comprobante = debitResponse.data;
        console.log("[OrdersService] Débito interno exitoso.");
        if (esServicioBCP) {
          console.log(
            `[OrdersService] El ítem pagado es una Deuda BCP (${datosPago.idPagoBCP}). Liquidando en el banco...`
          );
          await this.liquidarDeudaEnBcp(datosPago.idPagoBCP);
        }
      } catch (error) {
        console.error(
          "[OrdersService] Error en débito interno:",
          error.message
        );
        const msg = error.response?.data?.error || error.message;
        throw new Error(`Fallo al procesar el pago interno: ${msg}`);
      }
    } else {
      throw new Error("El 'origen' de datosPago debe ser 'BCP' o 'PAYFLOW'");
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
      // A. Crear el item de la orden
      await this.ordersRepository.createItemOrden({
        orden_id: orden.id,
        producto_id: item.productoId || null,
        servicio_id: item.servicioId || null,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        subtotal: item.subtotal,
      });

      if (item.servicioId) {
        if (item.seats && Array.isArray(item.seats) && item.seats.length > 0) {
            console.log(`[OrdersService] Procesando reserva de butacas para servicio ${item.servicioId}...`);
            try {
                await this.ordersRepository.reservarButacas(
                    item.servicioId,
                    item.seats,
                    clienteId
                );
                console.log(`[OrdersService] Butacas reservadas con éxito.`);
            } catch (seatError) {
                console.error(`[OrdersService] Error crítico reservando butacas: ${seatError.message}`);
                throw new Error(`Error al reservar butacas: ${seatError.message}`);
            }
        }

        try {
          const servicioInfo = await axios.get(
            `${this.servicesServiceUrl}/api/servicios/${item.servicioId}`
          );
          const esPrivado = !!servicioInfo.data.cliente_id;

          if (esPrivado) {
            await axios.patch(
              `${this.servicesServiceUrl}/api/servicios/${item.servicioId}/marcar-pagado`
            );
            console.log(
              `[OrdersService] Servicio PRIVADO ${item.servicioId} marcado como PAGADO.`
            );
          } else {
            console.log(
              `[OrdersService] Servicio PÚBLICO ${item.servicioId} pagado. No se altera su estado global.`
            );
          }
        } catch (e) {
          console.error(
            `[OrdersService] Error al gestionar estado del servicio ${item.servicioId}: ${e.message}`
          );
        }
      }
    }
    const ordenCompleta = await this.getOrdenById(orden.id);
    return {
      ordenPayflow: ordenCompleta.toJSON(),
      comprobante: comprobante,
    };
  }
  async liquidarDeudaEnBcp(pagoId){
    try {
      const payload = {
        cuentaId: this.PAYFLOW_MASTER_ACCOUNT_BCP,
        PagoId: pagoId,
      };
      await axios.post(
        `${this.bcpApiUrl}/pagos/realizar`,
        payload);
        console.log(
        `[OrdersService] Solicitada liquidación de Deuda BCP (idPagoBCP: ${pagoId}) en el banco.`
      );
    } catch (error) {
      throw new Error(`Error al liquidar deuda en BCP (idPagoBCP: ${pagoId}): ${error.message}`);
    }
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
  async getCuentasByDni(dni) {
    if (!dni) {
      throw new Error("El DNI es requerido para consultar las cuentas de BCP.");
    }
    try {
      const config = {
        method: "get",
        url: `${this.bcpApiUrl}`,
        timeout: 5000,
      };
      const bcpResponse = await this.sendBcpRequestWithRetry(config);
      return bcpResponse.data;
    } catch (err) {
      if (err.response) {
        throw new Error(
          `Error en la pasarela BCP (Cuentas): ${JSON.stringify(
            error.response.data
          )}`
        );
      }
      throw new Error(`Error de red llamando a BCP: ${error.message}`);
    }
  }
}

module.exports = OrdersService;
