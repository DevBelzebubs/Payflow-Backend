const axios = require("axios");

class ServicesService {
  constructor(servicesRepository) {
    this.servicesRepository = servicesRepository;
    const bcpFullUrl = process.env.BCP_API_URL || "http://localhost:8080/api/s2s";
    const urlObj = new URL(bcpFullUrl);
    this.bcpBaseUrl = urlObj.origin; 

    this.bcpAuthUrl = `${this.bcpBaseUrl}/auth/generar-token-servicio`;
    this.bcpPagosUrl = `${this.bcpBaseUrl}/api/pagos`;

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
    if (this.serviceTokenCache.token) {
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
      console.log(`[ServicesService] Solicitando token S2S a BCP en: ${this.bcpAuthUrl}`);
      
      const response = await axios.get(this.bcpAuthUrl, { timeout: 5000 });
      const newToken = response.data?.data?.token || response.data?.token;

      if (!newToken) {
        throw new Error("BCP no devolvió un token S2S válido en la estructura esperada.");
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
      const token = await this.getValidToken();
      const urlConsulta = `${this.bcpPagosUrl}/pendientes/usuario/${dni}`;
      
      const response = await axios.get(urlConsulta, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const deudasBCP = response.data.data || response.data;
      
      const serviciosTransformados = deudasBCP.map((deuda) => ({
        idServicio: `BCP-${deuda.idPago}`,
        nombre: deuda.nombreServicio || deuda.servicio || "Servicio BCP",
        descripcion: `Vence: ${deuda.fecha || 'N/A'}`,
        recibo: deuda.montoPendiente || deuda.monto,

        tipo_servicio: "UTILIDAD",
        imagenURL: null,
        proveedor: "Banco de Crédito (BCP)",
        activo: true,
        cliente_id: clienteId,
        info_adicional_json: {
          origen: "BCP",
          idPagoBCP: deuda.idPago,
          moneda: "PEN",
        },
      }));
      return serviciosTransformados;
    } catch (error) {
      console.error(
        `[ServicesService] Error consultando BCP (getServiciosBCP): ${error.message}`
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
    const { dni } = userTokenData;
    let bcpDebts = [];
    
    if (dni) {
      try {
        const token = await this.getValidToken();
        
        // URL Correcta: http://localhost:8080/api/pagos/pendientes/usuario/{dni}
        const urlConsulta = `${this.bcpPagosUrl}/pendientes/usuario/${dni}`;
        
        console.log(`[ServicesService] Consultando deudas a: ${urlConsulta}`);

        const response = await axios.get(urlConsulta, { 
            headers: { Authorization: `Bearer ${token}` } 
        });

        const datos = response.data.data || response.data;

        if (Array.isArray(datos)) {
          bcpDebts = datos.map((pago) => ({
            id: `BCP-${pago.idPago}`,
            nombre: pago.nombreServicio || "Servicio Desconocido",
            monto: pago.montoPendiente || pago.monto,
            fechaVencimiento: pago.fecha || new Date().toISOString(),
            estado: "PENDIENTE",
            origen: "BCP",
            logo: "https://via.placeholder.com/50?text=BCP",
          }));
        }
      } catch (error) {
        const status = error.response ? error.response.status : 'Unknown';
        console.error(`[ServicesService] Error obteniendo deudas BCP (Status: ${status}):`, error.message);
      }
    }
    return [...bcpDebts];
  }
}

module.exports = ServicesService;