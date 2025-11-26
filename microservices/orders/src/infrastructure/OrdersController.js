class OrdersController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  async createOrden(req, res) {
    try {
      const { clienteId, items, notas, datosPago } = req.body;
      const bcpUser = req.user;
      const authToken = req.headers.authorization;
      if (datosPago) {
        datosPago.userToken = authToken;
      }
      if (!clienteId || !items || items.length === 0 || !datosPago) {
        return res.status(400).json({ error: 'clienteId, items y datosPago son requeridos' });
      }
      const mainItem = items[0];
      const esProducto = !!mainItem.productoId;
      const esServicio = !!mainItem.servicioId;
      if (datosPago.origen === 'BCP') {
        datosPago.dniCliente = bcpUser.dni;

        if (esProducto) {
          if (!datosPago.numeroCuentaOrigen) {
            return res.status(400).json({ error: "El pago de productos con BCP requiere 'numeroCuentaOrigen'." });
          }
        } else if (esServicio) {
          if (!datosPago.numeroCuentaOrigen || !datosPago.idPagoBCP || !datosPago.monto) {
            return res.status(400).json({ error: "El pago de servicios BCP requiere 'numeroCuentaOrigen', 'idPagoBCP' y 'monto'." });
          }
        } else {
            return res.status(400).json({ error: "El item de la orden debe tener 'productoId' o 'servicioId'." });
        }

      } else if (datosPago.origen === 'MERCADOPAGO') {
        //Acá no va nd xd
      } else if (datosPago.origen === 'PAYFLOW'){
        if (!datosPago.cuentaId) {
            return res.status(400).json({ error: "El pago con 'PAYFLOW' requiere 'cuentaId'." });
         }
      } else {
         return res.status(400).json({ error: "El 'origen' de datosPago debe ser 'BCP', 'PAYFLOW' o 'MERCADOPAGO'" });
      }
      const resultado = await this.ordersService.createOrden({
        clienteId,
        items,
        notas
      }, datosPago);

      res.status(201).json(resultado);
      
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.error
        : error.message;
      res
        .status(400)
        .json({ error: errorMessage || "Error al procesar la orden." });
    }
  }

  async getOrden(req, res) {
    try {
      const { ordenId } = req.params;

      const orden = await this.ordersService.getOrdenById(ordenId);

      if (!orden) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      res.status(200).json(orden.toJSON());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrdenesByCliente(req, res) {
    try {
      const { clienteId } = req.params;

      const ordenes = await this.ordersService.getOrdenesByCliente(clienteId);

      res.status(200).json(ordenes.map((o) => o.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllOrdenes(req, res) {
    try {
      const ordenes = await this.ordersService.getAllOrdenes();

      res.status(200).json(ordenes.map((o) => o.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateOrdenEstado(req, res) {
    try {
      const { ordenId } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({ error: "estado es requerido" });
      }

      const orden = await this.ordersService.updateOrdenEstado(ordenId, estado);

      res.status(200).json(orden.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async cancelOrden(req, res) {
    try {
      const { ordenId } = req.params;
      const orden = await this.ordersService.cancelOrden(ordenId);
      res.status(200).json(orden.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async getCuentasBcp(req, res) {
    try {
      const dni = req.user?.dni;
      if (!dni) {
        return res
          .status(400)
          .json({
            error: "No se pudo encontrar el DNI del usuario en el token.",
          });
      }
      const cuentas = await this.ordersService.getCuentasByDni(dni);
      res.status(200).json(cuentas);
    } catch (err) {
      const errorMessage = error.response
        ? error.response.data.error
        : error.message;
      res
        .status(400)
        .json({
          error: errorMessage || "Error al consultar las cuentas de BCP.",
        });
    }
  }
  async receiveWebhook(req, res) {
    try {
      const { type, topic } = req.query;
      const id = req.query.id || req.query['data.id'];

      if (id && (type === 'payment' || topic === 'payment')) {
        console.log(`[Webhook] Notificación de pago recibida. ID: ${id}`);
        await this.ordersService.procesarWebhookMercadoPago(id);
      }
      res.sendStatus(200);
    } catch (error) {
      console.error("[Webhook] Error procesando notificación:", error.message);
      res.sendStatus(500);
    }
  }
  
}
module.exports = OrdersController;
