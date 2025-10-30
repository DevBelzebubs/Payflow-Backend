class OrdersController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  async createOrden(req, res) {
    try {
      const { clienteId, items, notas, pagoBcp } = req.body; 

      if (!clienteId || !items || items.length === 0 || !pagoBcp) {
        return res.status(400).json({ error: 'clienteId, items y pagoBcp son requeridos' });
      }
      
      if (!pagoBcp.dniCliente || !pagoBcp.numeroCuentaOrigen || !pagoBcp.idPagoBCP) {
         return res.status(400).json({ error: 'Datos de pagoBcp incompletos (dniCliente, numeroCuentaOrigen, idPagoBCP)' });
      }

      const resultado = await this.ordersService.createOrden({
        clienteId,
        items,
        notas
      }, pagoBcp);

      res.status(201).json(resultado);
    } catch (error) {
      const errorMessage = error.response ? error.response.data.error : error.message;
      res.status(400).json({ error: errorMessage || "Error al procesar la orden." });
    }
  }

  async getOrden(req, res) {
    try {
      const { ordenId } = req.params;

      const orden = await this.ordersService.getOrdenById(ordenId);

      if (!orden) {
        return res.status(404).json({ error: 'Orden no encontrada' });
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

      res.status(200).json(ordenes.map(o => o.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllOrdenes(req, res) {
    try {
      const ordenes = await this.ordersService.getAllOrdenes();

      res.status(200).json(ordenes.map(o => o.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateOrdenEstado(req, res) {
    try {
      const { ordenId } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({ error: 'estado es requerido' });
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
}

module.exports = OrdersController;
