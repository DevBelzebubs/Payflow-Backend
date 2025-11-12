class OrdersController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  async createOrden(req, res) {
    try {
      const { clienteId, items, notas, datosPago } = req.body;
      const bcpUser = req.user;

      if (!clienteId || !items || items.length === 0 || !datosPago) {
        return res.status(400).json({ error: 'clienteId, items y datosPago son requeridos' });
      }

      if (datosPago.origen === 'BCP') {
        if (!datosPago.numeroCuentaOrigen || !datosPago.idPagoBCP) {
          return res.status(400).json({ error: 'Datos de pago BCP incompletos (numeroCuentaOrigen, idPagoBCP)' });
        }
        datosPago.dniCliente = bcpUser.dni; 

      } else if (datosPago.origen === 'PAYFLOW') {
        if (!datosPago.cuentaId) {
          return res.status(400).json({ error: 'Datos de pago Payflow incompletos (cuentaId)' });
        }
      } else {
        return res.status(400).json({ error: "El 'origen' de datosPago debe ser 'BCP' o 'PAYFLOW'" });
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
}
module.exports = OrdersController;
