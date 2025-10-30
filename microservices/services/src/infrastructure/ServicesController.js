class ServicesController {
  constructor(servicesService) {
    this.servicesService = servicesService;
  }

  async createServicio(req, res) {
    try {
      const { nombre, descripcion, recibo } = req.body;

      if (!nombre || recibo === undefined) {
        return res.status(400).json({ error: 'Nombre y recibo son requeridos' });
      }

      const servicio = await this.servicesService.createServicio({
        nombre,
        descripcion,
        recibo
      });

      res.status(201).json(servicio.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getServicio(req, res) {
    try {
      const { idServicio } = req.params;

      const servicio = await this.servicesService.getServicioById(idServicio);

      if (!servicio) {
        return res.status(404).json({ error: 'Servicio no encontrado' });
      }

      res.status(200).json(servicio.toJSON());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllServicios(req, res) {
    try {
      const filters = {
      };

      const servicios = await this.servicesService.getAllServicios(filters);

      res.status(200).json(servicios.map(s => s.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateServicio(req, res) {
    try {
      const { idServicio } = req.params;
      const updateData = req.body;

      if (updateData.precio !== undefined && updateData.recibo === undefined) {
        updateData.recibo = updateData.precio;
        delete updateData.precio;
      }

      const servicio = await this.servicesService.updateServicio(idServicio, updateData);

      res.status(200).json(servicio.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteServicio(req, res) {
    try {
      const { idServicio } = req.params;

      await this.servicesService.deleteServicio(idServicio);

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  async marcarComoPagado(req, res) {
    try {
      const { idServicio } = req.params;
      const servicio = await this.servicesService.updateServicioStatus(idServicio, 'PAGADO');
      res.status(200).json(servicio.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = ServicesController;
