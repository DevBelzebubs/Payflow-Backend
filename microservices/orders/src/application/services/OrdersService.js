class OrdersService {
  constructor({ ordersRepository, productService, serviceService, bankAccountService, mercadopagoClient, bcpPaymentClient }) {
    this.ordersRepository = ordersRepository;
    this.productService = productService;
    this.serviceService = serviceService;
    this.bankAccountService = bankAccountService;
    this.mercadopagoClient = mercadopagoClient;
    this.bcpPaymentClient = bcpPaymentClient;
  }

  async createOrden(ordenData, datosPago) {
    const { clienteId, items, notas } = ordenData;
    if (!clienteId) throw new Error('El clienteId es requerido para crear la orden.');

    const mainItem = items[0];
    const esServicioBCP = !!mainItem.servicioId && !!datosPago.idPagoBCP;
    let subtotal = 0;
    let servicioIdParaPagar = null;
    let descripcionCompra = 'Compra en Payflow';

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
          const p = await this.productService.getProductoById(item.productoId);
          precio = p.precio;
          descripcionCompra = `Producto ${p.nombre}`;
        } else if (item.servicioId) {
          if (item.ticketTypeId) {
            const types = await this.serviceService.getTicketTypes(item.servicioId);
            const type = types.find(x => x.id === item.ticketTypeId);
            precio = type ? type.precio : 0;
            descripcionCompra = `Entrada ${type?.nombre}`;
          } else {
            const s = await this.serviceService.getServicioById(item.servicioId);
            precio = s.recibo;
            descripcionCompra = `Servicio ${s.nombre}`;
          }
        }
        item.precioUnitario = precio;
        item.subtotal = precio * item.cantidad;
        subtotal += item.subtotal;
      }
    }

    const impuestos = subtotal * 0.18;
    let total = subtotal + impuestos;
    let comprobante = null;

    if (datosPago.origen === 'MERCADOPAGO') {
      const ordenPendiente = await this.ordersRepository.createOrden({
        cliente_id: clienteId, total, subtotal, impuestos,
        estado: 'pendiente', notas: notas || 'Pago iniciado con Mercado Pago',
      });

      for (const item of items) {
        await this.ordersRepository.createItemOrden({
          orden_id: ordenPendiente.id,
          producto_id: item.productoId || null,
          servicio_id: item.servicioId || null,
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario,
          subtotal: item.subtotal,
        });
        if (item.servicioId && item.seats) {
          await this.ordersRepository.reservarButacas(item.servicioId, item.seats, clienteId);
        }
      }

      const urlPago = await this.mercadopagoClient.createPreference(
        ordenPendiente.id, descripcionCompra, Number(total.toFixed(2))
      );

      const ordenResponse = await this.getOrdenById(ordenPendiente.id);
      return { ordenPayflow: ordenResponse.toJSON(), urlPago, isRedirect: true };
    }

    if (datosPago.origen === 'BCP') {
      comprobante = await this.bcpPaymentClient.ejecutarDebito({
        dniCliente: datosPago.dniCliente,
        numeroCuentaOrigen: datosPago.numeroCuentaOrigen,
        monto: esServicioBCP ? total : subtotal,
        descripcionCompra,
        esServicioBCP,
        idPagoBCP: datosPago.idPagoBCP,
        idServicioPayflow: servicioIdParaPagar,
      });
    } else if (datosPago.origen === 'PAYFLOW') {
      total = Number((subtotal * 0.8).toFixed(2));
      await this.bankAccountService.debitar(datosPago.cuentaId, total, datosPago.userToken);

      if (esServicioBCP) {
        await this.bcpPaymentClient.liquidarDeuda(datosPago.idPagoBCP);
      }
    }

    const orden = await this.ordersRepository.createOrden({
      cliente_id: clienteId, total, subtotal, impuestos,
      estado: 'CONFIRMADA', notas,
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

      if (item.productoId) {
        try {
          await this.productService.descontarStock(item.productoId, item.cantidad);
        } catch (stockError) {
          console.error(`Error al actualizar stock del producto ${item.productoId}: ${stockError.message}`);
        }
      }

      if (item.servicioId && item.seats) {
        await this.ordersRepository.reservarButacas(item.servicioId, item.seats, clienteId);
      }
    }

    const ordenCompleta = await this.getOrdenById(orden.id);
    return { ordenPayflow: ordenCompleta.toJSON(), comprobante };
  }

  async procesarWebhookMercadoPago(paymentId) {
    const paymentData = await this.mercadopagoClient.getPayment(paymentId);
    const { status, external_reference } = paymentData;

    if (status === 'approved' && external_reference) {
      const orden = await this.ordersRepository.findOrdenById(external_reference);
      if (orden && orden.estado !== 'confirmada') {
        await this.ordersRepository.updateOrden(external_reference, {
          estado: 'confirmada',
          notas: `Pago confirmado por Mercado Pago. ID: ${paymentId}`,
        });

        if (orden.items && orden.items.length > 0) {
          for (const item of orden.items) {
            if (item.producto_id) {
              try {
                await this.productService.descontarStock(item.producto_id, item.cantidad);
              } catch (e) {
                console.error('Error descontando stock en webhook:', e.message);
              }
            }
          }
        }
      }
    }
  }

  async liquidarDeudaEnBcp(pagoId) {
    return await this.bcpPaymentClient.liquidarDeuda(pagoId);
  }

  async getSalesStats() { return await this.ordersRepository.getSalesStats(); }
  async getOrdenById(id) { return await this.ordersRepository.findOrdenById(id); }
  async getOrdenesByCliente(id) { return await this.ordersRepository.findOrdenesByCliente(id); }
  async getAllOrdenes() { return await this.ordersRepository.findAllOrdenes(); }

  async procesarRenovaciones() {
    const suscripcionesVencidas = await this.ordersRepository.findSuscripcionesParaRenovar();
    const resultados = { exitosos: 0, fallidos: 0 };

    for (const sub of suscripcionesVencidas) {
      try {
        if (!sub.cuenta_origen_id) { resultados.fallidos++; continue; }

        await this.bankAccountService.debitar(sub.cuenta_origen_id, sub.precio_acordado, null);

        const nuevaOrden = await this.ordersRepository.createOrden({
          cliente_id: sub.cliente_id,
          total: sub.precio_acordado,
          subtotal: sub.precio_acordado / 1.18,
          impuestos: sub.precio_acordado - sub.precio_acordado / 1.18,
          estado: 'COMPLETADA',
          notas: `Renovación automática: ${sub.nombre_servicio}`,
        });

        await this.ordersRepository.createItemOrden({
          orden_id: nuevaOrden.id,
          servicio_id: sub.servicio_id,
          cantidad: 1,
          precio_unitario: sub.precio_acordado,
          subtotal: sub.precio_acordado,
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
