const axios = require("axios");
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago'); // <--- IMPORTANTE: Payment agregado

class OrdersService {
  constructor(ordersRepository) {
    this.ordersRepository = ordersRepository;
    this.productsServiceUrl = process.env.PRODUCTS_SERVICE_URL || "http://localhost:3003";
    this.servicesServiceUrl = process.env.SERVICES_SERVICE_URL || "http://localhost:3004";
    this.bankAccountsServiceUrl = process.env.BANK_ACCOUNTS_SERVICE_URL || "http://localhost:3006";
    this.bcpApiUrl = process.env.BCP_API_URL || "http://localhost:8080/api/s2s";
    this.bcpAuthUrl = (process.env.BCP_API_URL || "http://localhost:8080/api/s2s").replace("/api/s2s", "/auth/generar-token-servicio");

    this.serviceTokenCache = { token: null, isFetching: false };
    this.PAYFLOW_MASTER_ACCOUNT_BCP = "CUENTA-MAESTRA-PAYFLOW-001";

    // Token de PRUEBA (Sandbox)
    this.mpClient = new MercadoPagoConfig({ 
        accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-4185258706689566-112317-136adc9dfbc200960d9a8887e592eb5e-2443484377' 
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
      throw new Error(`Error token BCP: ${e.message}`);
    } finally {
      this.serviceTokenCache.isFetching = false;
    }
  }

  async sendBcpRequestWithRetry(axiosConfig) {
    try {
      const token = await this.getValidServiceToken();
      axiosConfig.headers = { ...axiosConfig.headers, Authorization: `Bearer ${token}` };
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

    const mainItem = items[0];
    let esProductoPayflow = !!mainItem.productoId;
    let esServicioBCP = !!mainItem.servicioId && !!datosPago.idPagoBCP;
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

    const impuestos = subtotal * 0.16; 
    const total = subtotal + impuestos;
    let comprobante = null;

    // --- FLUJO MERCADO PAGO ---
    if (datosPago.origen === 'MERCADOPAGO') {
        console.log("[OrdersService] Iniciando flujo Mercado Pago...");
        
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
        
        // URLs apuntando al PUERTO 3010 (Frontend)
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
                success: "http://localhost:3010/dashboard/history?status=success",
                failure: "http://localhost:3010/dashboard/payment/checkout?status=failure",
                pending: "http://localhost:3010/dashboard/payment/checkout?status=pending"
            },
            //auto_return: "approved",
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

    // --- FLUJO BCP / PAYFLOW ---
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
        estado: "confirmada", 
        notas
    });

    for (const item of items) {
        await this.ordersRepository.createItemOrden({
            orden_id: orden.id,
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

    const ordenCompleta = await this.getOrdenById(orden.id);
    return {
        ordenPayflow: ordenCompleta.toJSON(),
        comprobante
    };
  }

  async procesarWebhookMercadoPago(paymentId) {
    try {
      // 1. Consultar a Mercado Pago
      const payment = new Payment(this.mpClient);
      const paymentData = await payment.get({ id: paymentId });
      
      const { status, external_reference } = paymentData;

      if (status === 'approved') {
          console.log(`[OrdersService] Pago ${paymentId} APROBADO. Orden vinculada: ${external_reference}`);
          
          if (external_reference) {
              const orden = await this.ordersRepository.findOrdenById(external_reference);
              
              if (orden && orden.estado !== 'confirmada') {
                  await this.ordersRepository.updateOrden(external_reference, {
                      estado: 'confirmada',
                      notas: `Pago confirmado por Mercado Pago. ID: ${paymentId}`
                  });
                  console.log(`[OrdersService] Orden ${external_reference} CONFIRMADA.`);
              } else {
                  console.log(`[OrdersService] La orden ${external_reference} ya estaba procesada.`);
              }
          }
      } else {
          console.log(`[OrdersService] Pago ${paymentId} estado: ${status}`);
      }
    } catch (error) {
      console.error(`[OrdersService] Error verificando pago ${paymentId}:`, error.message);
      throw error; 
    }
  }

  async liquidarDeudaEnBcp(pagoId){
    try {
      const payload = { cuentaId: this.PAYFLOW_MASTER_ACCOUNT_BCP, PagoId: pagoId };
      await axios.post(`${this.bcpApiUrl}/pagos/realizar`, payload);
    } catch (error) {
      throw new Error(`Error liquidando BCP: ${error.message}`);
    }
  }

  async getOrdenById(id) { return await this.ordersRepository.findOrdenById(id); }
  async getOrdenesByCliente(id) { return await this.ordersRepository.findOrdenesByCliente(id); }
  async getAllOrdenes() { return await this.ordersRepository.findAllOrdenes(); }
  async getCuentasByDni(dni) { /* Lógica existente */ }
}

module.exports = OrdersService;