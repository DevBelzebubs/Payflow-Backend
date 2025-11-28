const axios = require("axios");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

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

    const bcpBase = process.env.BCP_API_URL || "http://localhost:8080/api/s2s";
    this.bcpAuthUrl = bcpBase.replace(
      "/api/s2s",
      "/auth/generar-token-servicio"
    );

    this.serviceTokenCache = { token: null, isFetching: false };
    this.PAYFLOW_MASTER_ACCOUNT_BCP = "CUENTA-MAESTRA-PAYFLOW-001";

    this.mpClient = new MercadoPagoConfig({
      accessToken: process.env.ACCESS_TOKEN || "TEST-TOKEN-GENERICO",
    });
  }

  async getValidServiceToken() {
    if (this.serviceTokenCache.token) return this.serviceTokenCache.token;
    return await this.refreshServiceToken();
  }

  async refreshServiceToken() {
    if (this.serviceTokenCache.isFetching) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return this.serviceTokenCache.token;
    }
    try {
      this.serviceTokenCache.isFetching = true;
      const response = await axios.get(this.bcpAuthUrl, { timeout: 5000 });
      this.serviceTokenCache.token = response.data?.token;
      return this.serviceTokenCache.token;
    } catch (e) {
      this.serviceTokenCache.token = null;
      console.warn(
        `[OrdersService] Advertencia: No se pudo obtener token BCP: ${e.message}`
      );
      return null;
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
      return await axios(axiosConfig);
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await this.refreshServiceToken();
        axiosConfig.headers.Authorization = `Bearer ${newToken}`;
        return await axios(axiosConfig);
      }
      throw error;
    }
  }

  async createOrden(ordenData, datosPago) {
    const { clienteId, items, notas } = ordenData;
    if (!clienteId) throw new Error("El clienteId es requerido para crear la orden.");

    console.log(`[OrdersService] Iniciando creación de orden para cliente ${clienteId}`);

    const mainItem = items[0];
    let esServicioBCP = !!mainItem.servicioId && !!datosPago.idPagoBCP;
    let esProductoPayflow = !!mainItem.productoId;
    let subtotal = 0;
    let servicioIdParaPagar = null;
    let descripcionCompra = "Compra en Payflow";

    if (esServicioBCP) {
      subtotal = datosPago.monto;
      servicioIdParaPagar = mainItem.servicioId;
      descripcionCompra = `Servicio BCP ${mainItem.servicioId}`;
      mainItem.precioUnitario = subtotal / mainItem.cantidad;
      mainItem.subtotal = subtotal;
    } else {
      for (const item of items) {
        let precio = 0;
        if (item.productoId) {
          const p = await axios.get(`${this.productsServiceUrl}/api/productos/${item.productoId}`);
          precio = p.data.precio;
          descripcionCompra = `Producto ${p.data.nombre}`;
        } else if (item.servicioId) {
          if (item.ticketTypeId) {
             const t = await axios.get(`${this.servicesServiceUrl}/api/servicios/${item.servicioId}/tipos-entrada`);
             const type = t.data.find(x => x.id === item.ticketTypeId);
             precio = type ? type.precio : 0;
             descripcionCompra = `Entrada ${type?.nombre}`;
          } else {
             const s = await axios.get(`${this.servicesServiceUrl}/api/servicios/${item.servicioId}`);
             precio = s.data.recibo; 
             descripcionCompra = `Servicio ${s.data.nombre}`;
          }
        }
        item.precioUnitario = precio;
        item.subtotal = precio * item.cantidad;
        subtotal += item.subtotal;
      }
    }

    const impuestos = subtotal * 0.18;
    const total = subtotal + impuestos;
    let comprobante = null;

    if (datosPago.origen === 'MERCADOPAGO') {
        console.log("[OrdersService] Generando preferencia Mercado Pago...");
        
        const ordenPendiente = await this.ordersRepository.createOrden({
            cliente_id: clienteId, 
            total,
            subtotal,
            impuestos,
            estado: 'pendiente', 
            notas: notas || "Pago iniciado con Mercado Pago"
        });

        for (const item of items) {
            await this.ordersRepository.createItemOrden({
                orden_id: ordenPendiente.id,
                producto_id: item.productoId || null,
                servicio_id: item.servicioId || null,
                cantidad: item.cantidad,
                precio_unitario: item.precioUnitario,
                subtotal: item.subtotal
            });
            if (item.servicioId && item.seats) {
                await this.ordersRepository.reservarButacas(item.servicioId, item.seats, clienteId);
            }
        }

        const preference = new Preference(this.mpClient);
        const mpBody = {
            items: [
                {
                    id: "ORD-" + ordenPendiente.id,
                    title: descripcionCompra,
                    quantity: 1,
                    unit_price: Number(total.toFixed(2))
                }
            ],
            external_reference: ordenPendiente.id,
            back_urls: {
                success: "http://localhost:3010/dashboard/history?status=success&type=cart",
                failure: "http://localhost:3010/dashboard/payment/checkout?status=failure",
                pending: "http://localhost:3010/dashboard/payment/checkout?status=pending"
            },
            auto_return: "approved",
        };

        try {
            const result = await preference.create({ body: mpBody });
            const ordenResponse = await this.getOrdenById(ordenPendiente.id);
            return {
                ordenPayflow: ordenResponse.toJSON(),
                urlPago: result.init_point,
                isRedirect: true
            };
        } catch (mpError) {
            console.error("[OrdersService] Error SDK Mercado Pago:", mpError);
            throw new Error(`Fallo al crear preferencia en Mercado Pago: ${mpError.message}`);
        }
    }

    if (datosPago.origen === "BCP") {
        const debitoRequest = {
            dniCliente: datosPago.dniCliente,
            numeroCuentaOrigen: datosPago.numeroCuentaOrigen,
            monto: esServicioBCP ? total : subtotal, 
            descripcionCompra: descripcionCompra
        };
        if (esServicioBCP) {
             debitoRequest.idPagoBCP = datosPago.idPagoBCP;
             debitoRequest.idServicioPayflow = servicioIdParaPagar;
        }
        
        const url = esServicioBCP ? `${this.bcpApiUrl}/pagos/solicitar-debito` : `${this.bcpApiUrl}/debito/ejecutar`;
        const bcpRes = await this.sendBcpRequestWithRetry({ method: 'post', url, data: debitoRequest });
        comprobante = bcpRes.data;

    } else if (datosPago.origen === "PAYFLOW") {
        console.log(`[OrdersService] Iniciando débito interno Payflow. Cuenta: ${datosPago.cuentaId}, Monto: ${total}`);
        await axios.post(`${this.bankAccountsServiceUrl}/api/cuentas-bancarias/debitar`, {
            cuentaId: datosPago.cuentaId,
            monto: total
        }, { headers: { Authorization: datosPago.userToken } });
        
        if (esServicioBCP) await this.liquidarDeudaEnBcp(datosPago.idPagoBCP);
    }
    const orden = await this.ordersRepository.createOrden({
        cliente_id: clienteId, 
        total,
        subtotal,
        impuestos,
        estado: "CONFIRMADA", 
        notas
    });

    console.log(`[OrdersService] Orden ${orden.id} creada exitosamente. Procesando items...`);

    for (const item of items) {
        await this.ordersRepository.createItemOrden({
            orden_id: orden.id,
            producto_id: item.productoId || null,
            servicio_id: item.servicioId || null,
            cantidad: item.cantidad,
            precio_unitario: item.precioUnitario,
            subtotal: item.subtotal
        });

        if (item.productoId) {
            try {
                console.log(`[OrdersService] 📉 Descontando stock para producto ${item.productoId}. Cantidad a restar: ${item.cantidad}`);
                const stockUrl = `${this.productsServiceUrl}/api/productos/${item.productoId}/stock`;
                await axios.patch(stockUrl, {
                    cantidad: -item.cantidad
                });
                console.log(`[OrdersService] ✅ Stock actualizado correctamente.`);
            } catch (stockError) {
                console.error(
                    `[OrdersService] ❌ ERROR CRÍTICO al actualizar stock del producto ${item.productoId}: ${stockError.message}`
                );
            }
        }

        if (item.servicioId && item.seats) {
             await this.ordersRepository.reservarButacas(item.servicioId, item.seats, clienteId);
        }
    }

    const ordenCompleta = await this.getOrdenById(orden.id);
    return {
        ordenPayflow: ordenCompleta.toJSON(),
        comprobante
    };
  }

  async procesarWebhookMercadoPago(paymentId) {
    try {
      const payment = new Payment(this.mpClient);
      const paymentData = await payment.get({ id: paymentId });

      const { status, external_reference } = paymentData;

      if (status === "approved" && external_reference) {
        console.log(
          `[OrdersService] Pago ${paymentId} APROBADO. Orden vinculada: ${external_reference}`
        );

        const orden = await this.ordersRepository.findOrdenById(
          external_reference
        );

        if (orden && orden.estado !== "confirmada") {
          await this.ordersRepository.updateOrden(external_reference, {
            estado: "confirmada",
            notas: `Pago confirmado por Mercado Pago. ID: ${paymentId}`,
          });
          if (orden.items && orden.items.length > 0) {
            for (const item of orden.items) {
              if (item.producto_id) {
                try {
                  await axios.patch(
                    `${this.productsServiceUrl}/api/productos/${item.producto_id}/stock`,
                    {
                      cantidad: -item.cantidad,
                    }
                  );
                } catch (e) {
                  console.error(
                    "Error descontando stock en webhook:",
                    e.message
                  );
                }
              }
            }
          }
          console.log(
            `[OrdersService] Orden ${external_reference} CONFIRMADA.`
          );
        }
      }
    } catch (error) {
      console.error(
        `[OrdersService] Error verificando pago ${paymentId}:`,
        error.message
      );
      throw error;
    }
  }

  async liquidarDeudaEnBcp(pagoId) {
    try {
      const payload = {
        cuentaId: this.PAYFLOW_MASTER_ACCOUNT_BCP,
        PagoId: pagoId,
      };
      await axios.post(`${this.bcpApiUrl}/pagos/realizar`, payload);
    } catch (error) {
      throw new Error(`Error liquidando BCP: ${error.message}`);
    }
  }

  async getOrdenById(id) {
    return await this.ordersRepository.findOrdenById(id);
  }
  async getOrdenesByCliente(id) {
    return await this.ordersRepository.findOrdenesByCliente(id);
  }
  async getAllOrdenes() {
    return await this.ordersRepository.findAllOrdenes();
  }
  async getCuentasByDni(dni) {
    return [];
  }
  async procesarRenovaciones() {
    const suscripcionesVencidas =
      await this.ordersRepository.findSuscripcionesParaRenovar();
    const resultados = { exitosos: 0, fallidos: 0 };
    for (const sub of suscripcionesVencidas) {
      try {
        if (!sub.cuena_origen_id) {
          resultados.fallidos++;
          continue;
        }
        await axios.post(
          `${this.bankAccountsServiceUrl}/api/cuentas-bancarias/debitar`,
          {
            cuentaId: sub.cuenta_origen_id,
            monto: sub.precio_acordado,
          },
          {
            headers: {
              Authorization: `Bearer ${await this.getValidServiceToken()}`,
            },
          }
        );
        const nuevaOrden = await this.ordersRepository.createOrden({
          cliente_id: sub.cliente_id,
          total:sub.precio_acordado,
          subtotal:sub.precio_acordado /1.18,
          impuestos:sub.precio_acordado - (sub.precio_acordado / 1.18),
          estado: 'COMPLETADA',
          notas: `Renovación automática: ${sub.nombre_servicio}`
        });
        await this.ordersRepository.createItemOrden({
          orden_id: nuevaOrden.id,
          servicio_id: sub.servicio_id,
          cantidad: 1,
          precio_unitario : sub.precio_acordado,
          subtotal: sub.precio_acordado
        });
        await this.ordersRepository.updateProximoPagoSuscripcion(sub.id);
        resultados.exitosos++;
      } catch (error) {
        console.error(`[Renovación] Fallo al renovar suscripción ${sub.id}:`, error.message);
        resultados.fallidos++;
      }
    }
    return resultados;
  }
}

module.exports = OrdersService;
