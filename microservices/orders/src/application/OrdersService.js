const axios = require('axios');

class OrdersService {
  constructor(ordersRepository) {
    this.ordersRepository = ordersRepository;
    this.productsServiceUrl = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003';
    this.servicesServiceUrl = process.env.SERVICES_SERVICE_URL || 'http://localhost:3004';

    this.bcpApiUrl = process.env.BCP_API_URL || 'http://localhost:8080/api';
    this.serviceToken = process.env.PAYFLOW_SERVICE_TOKEN;
  }

  async createOrden(ordenData, pagoBcp) {
    const { clienteId, items, notas } = ordenData;
    if (!this.serviceToken) {
        throw new Error('Configuración: Falta el token de servicio S2S (PAYFLOW_SERVICE_TOKEN) en .env');
    }

    let subtotal = 0;
    let servicioIdParaPagar = null;

    for (const item of items) {
      let precio = 0;

      if (item.productoId) {
        const response = await axios.get(`${this.productsServiceUrl}/api/productos/${item.productoId}`);
        precio = response.data.precio;
      } else if (item.servicioId) {
        const response = await axios.get(`${this.servicesServiceUrl}/api/servicios/${item.servicioId}`);
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
      monto: total,
      idPagoBCP: pagoBcp.idPagoBCP,
      idServicioPayflow: servicioIdParaPagar 
    };

    let comprobanteBcp;
    try {
      console.log('Enviando solicitud de débito a BCP...');
      const bcpResponse = await axios.post(
        `${this.bcpApiUrl}/pagos/solicitar-debito`, 
        debitoRequest, 
        { headers: { 'Authorization': `Bearer ${this.serviceToken}` } }
      );
      comprobanteBcp = bcpResponse.data;
      console.log('BCP confirmó el débito.');

    } catch (error) {
      console.error("Error en la llamada S2S a BCP:", error.response ? error.response.data : error.message);
      throw new Error(`Error en la pasarela BCP: ${error.response ? error.response.data.error : "Error desconocido"}`);
    }

    const orden = await this.ordersRepository.createOrden({
      cliente_id: clienteId,
      total,
      subtotal,
      impuestos,
      estado: 'CONFIRMADA',
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

      if (item.servicioId) {
        try {
            await axios.patch(`${this.servicesServiceUrl}/api/servicios/${item.servicioId}/marcar-pagado`);
            console.log(`Servicio Payflow ${item.servicioId} marcado como PAGADO.`);
         } catch (e) {
            console.error(`Error al marcar servicio ${item.servicioId} como pagado: ${e.message}`);
         }
      }
    }

    const ordenCompleta = await this.getOrdenById(orden.id);
    return {
        ordenPayflow: ordenCompleta.toJSON(),
        comprobanteBCP: comprobanteBcp
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
    return await this.ordersRepository.updateOrden(ordenId, { estado: nuevoEstado });
  }

  async cancelOrden(ordenId) {
    const orden = await this.ordersRepository.findOrdenById(ordenId);

    if (!orden) {
      throw new Error('Orden no encontrada');
    }

    if (orden.estado === 'completada') {
      throw new Error('No se puede cancelar una orden completada');
    }

    for (const item of orden.items) {
      if (item.producto_id) {
        await axios.patch(`${this.productsServiceUrl}/api/productos/${item.producto_id}/stock`, {
          cantidad: item.cantidad
        });
      }
    }

    return await this.ordersRepository.updateOrden(ordenId, { estado: 'cancelada' });
  }
}

module.exports = OrdersService;
