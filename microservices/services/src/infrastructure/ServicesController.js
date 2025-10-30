class ServicesController {
  constructor(servicesService) {
    this.servicesService = servicesService;
  }

  async createServicio(req, res) {
    try {
      const { nombre, descripcion, precio, duracion_estimada, categoria } = req.body;

      if (!nombre || !precio) {
        return res.status(400).json({ error: 'Nombre y precio son requeridos' });
      }

      const servicio = await this.servicesService.createServicio({
        nombre,
        descripcion,
        precio,
        duracion_estimada,
        categoria,
        activo: true
      });

      res.status(201).json(servicio.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getServicio(req, res) {
    try {
      const { servicioId } = req.params;

      const servicio = await this.servicesService.getServicioById(servicioId);

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
        activo: req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : undefined,
        categoria: req.query.categoria
      };

      const servicios = await this.servicesService.getAllServicios(filters);

      res.status(200).json(servicios.map(s => s.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateServicio(req, res) {
    try {
      const { servicioId } = req.params;
      const updateData = req.body;

      const servicio = await this.servicesService.updateServicio(servicioId, updateData);

      res.status(200).json(servicio.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteServicio(req, res) {
    try {
      const { servicioId } = req.params;

      await this.servicesService.deleteServicio(servicioId);

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = ServicesController;
