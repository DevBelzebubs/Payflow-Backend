const axios = require("axios");
class ServicesService {
  constructor(servicesRepository) {
    this.servicesRepository = servicesRepository;
    this.bcpApiUrl = (
      process.env.BCP_API_URL || "http://localhost:8080/api/s2s"
    ).replace("/api/s2s", "/auth/generar-token-servicio");
    this.serviceTokenCache = {
      token: null,
      isFetching: false,
    };
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
  async getValidToken() {
    if (this.serviceTokenCache) {
      return this.serviceTokenCache.token;
    }
    return await this.refreshServiceToken();
  }
  async getAllServicios(filters = {}) {
    return await this.servicesRepository.findAllServicios(filters);
  }
  async refreshServiceToken() {
    if (this.serviceTokenCache.isFetching) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return this.serviceTokenCache.token;
    }
    try {
      this.serviceTokenCache.isFetching = true;
      console.log("[ServicesService] Solicitando token S2S a BCP...");
      const response = await axios.get(this.bcpAuthUrl, { timeout: 5000 });
      const newToken = response.data?.token || response.data?.data?.token;
      if (!newToken) {
        throw new Error("BCP no devolvió un token S2S válido.");
      }
      this.serviceTokenCache.token = newToken;
      return newToken;
    } catch (e) {
      console.error("[ServicesService] Error refresh token:", e.message);
      this.serviceTokenCache.token = null;
      throw e;
    } finally {
      this.serviceTokenCache.isFetching = false;
    }
  }
  async getServiciosBCP(userBcpData) {
    const { dni, clienteId } = userBcpData;
    if (!dni) {
      throw new Error("El token JWT de BCP no contiene el claim 'dni'.");
    }
    try {
      const token = await this.getValidServiceToken();
      const urlConsulta = `${this.bcpApiUrl.replace('/s2s', '')}/pagos/pendientes/usuario/${dni}`;
      const response = await axios.get(urlConsulta, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const deudasBCP = response.data.data || response.data;
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
      console.error(
        `[ServicesService] Error consultando BCP: ${error.message}`
      );
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
  async getMisDeudasPendientes(userTokenData) {
    const { dni, userType } = userTokenData;
    let bcpDebts = [];
    if (userType === "BCP" && dni) {
      try {
        const token = await this.getValidServiceToken();
        const response = await axios.get(
          `${this.bcpApiUrl.replace(
            "/s2s",
            ""
          )}/pagos/pendientes/usuario/${dni}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          bcpDebts = response.data.data.map((pago) => ({
            id: `BCP-${pago.idPago}`,
            nombre: pago.nombreServicio,
            monto: pago.monto,
            fechaVencimiento: pago.fecha,
            estado: "PENDIENTE",
            origen: "BCP",
            logo: "https://via.placeholder.com/50?text=BCP",
          }));
        }
      } catch (error) {
        console.error("Error obteniendo deudas BCP:", error.message);
      }
    }
    return [...bcpDebts];
  }
}

module.exports = ServicesService;
