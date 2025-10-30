const axios = require('axios');

class OrdersService {
  constructor(ordersRepository) {
    this.ordersRepository = ordersRepository;
    this.productsServiceUrl = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003';
    this.servicesServiceUrl = process.env.SERVICES_SERVICE_URL || 'http://localhost:3004';
  }

  async createOrden(ordenData) {
    const { clienteId, items, notas } = ordenData;

    let subtotal = 0;

    for (const item of items) {
      let precio = 0;

      if (item.productoId) {
        const response = await axios.get(`${this.productsServiceUrl}/api/productos/${item.productoId}`);
        precio = response.data.precio;
      } else if (item.servicioId) {
        const response = await axios.get(`${this.servicesServiceUrl}/api/servicios/${item.servicioId}`);
        precio = response.data.precio;
      }

      item.precioUnitario = precio;
      item.subtotal = precio * item.cantidad;
      subtotal += item.subtotal;
    }

    const impuestos = subtotal * 0.16;
    const total = subtotal + impuestos;

    const orden = await this.ordersRepository.createOrden({
      cliente_id: clienteId,
      total,
      subtotal,
      impuestos,
      estado: 'pendiente',
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

      if (item.productoId) {
        await axios.patch(`${this.productsServiceUrl}/api/productos/${item.productoId}/stock`, {
          cantidad: -item.cantidad
        });
      }
    }

    return await this.getOrdenById(orden.id);
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
