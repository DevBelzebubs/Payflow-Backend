const axios = require("axios");
class ServicesService {
  constructor(servicesRepository) {
    this.servicesRepository = servicesRepository;
    this.bcpApiUrl = process.env.BCP_API_URL || "http://localhost:8080/api/s2s";
  }

  async createServicio(servicioData) {
    const dataToCreate = {
      nombre: servicioData.nombre,
      descripcion: servicioData.descripcion,
      recibo: servicioData.recibo,
    };
    return await this.servicesRepository.createServicio(dataToCreate);
  }

  async getServicioById(idServicio) {
    return await this.servicesRepository.findServicioById(idServicio);
  }

  async getAllServicios(filters = {}) {
    return await this.servicesRepository.findAllServicios(filters);
  }
  async getServiciosBCP(userBcpData) {
    const { dni, clienteId } = userBcpData;
    if (!dni) {
      throw new Error("El token JWT de BCP no contiene el claim 'dni'.");
    }
    try {
      const response = await axios.get(
        `${this.bcpApiUrl}/pagos/pendientes/usuario/${dni}`
      );
      const deudasBCP = response.data;
      const serviciosTransformados = deudasBCP.map((deuda) => ({
        idServicio: `BCP-${deuda.idPago}`,
        nombre: deuda.servicio || deuda.empresa || "Servicio BCP",
        descripcion: `Vence: ${deuda.fechaVencimiento} - Código: ${deuda.codigoCliente}`,
        recibo: deuda.monto,

        tipo_servicio: "UTILIDAD",
        imagenURL: null,
        proveedor: "Banco de Crédito (BCP)",
        activo: true,
        cliente_id: clienteId,
        info_adicional_json: {
          origen: "BCP",
          idPagoBCP: deuda.idPago,
          idDeuda: deuda.idDeuda,
          moneda: deuda.moneda,
        },
      }));
      return serviciosTransformados;
    } catch (error) {
      console.error(`[ServicesService] Error consultando BCP: ${error.message}`);
      return [];
    }
  }
  async updateServicio(idServicio, servicioData) {
    const dataToUpdate = {};
    if (servicioData.nombre !== undefined)
      dataToUpdate.nombre = servicioData.nombre;
    if (servicioData.descripcion !== undefined)
      dataToUpdate.descripcion = servicioData.descripcion;
    if (servicioData.recibo !== undefined)
      dataToUpdate.recibo = servicioData.recibo;

    return await this.servicesRepository.updateServicio(
      idServicio,
      dataToUpdate
    );
  }

  async updateServicioStatus(idServicio, estado) {
    console.log(
      `Lógica de servicio para actualizar estado de ${idServicio} a ${estado}`
    );
    return await this.servicesRepository.updateServicio(idServicio, {
      estado: estado,
    });
  }
  async getOccupiedSeats(idServicio) {
    return await this.servicesRepository.findOccupiedSeats(idServicio);
  }
  async getTicketTypes(idServicio) {
    return await this.servicesRepository.findTicketTypesByServiceId(idServicio);
  }
}

module.exports = ServicesService;
