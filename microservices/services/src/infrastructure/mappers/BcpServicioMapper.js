class BcpServicioMapper {
  static toPendingDebt(bcpData, clienteId) {
    return {
      idServicio: `BCP-${bcpData.idPago}`,
      nombre: bcpData.nombreServicio || bcpData.servicio || 'Servicio BCP',
      descripcion: `Vence: ${bcpData.fecha || 'N/A'}`,
      recibo: bcpData.montoPendiente || bcpData.monto,
      tipo_servicio: 'UTILIDAD',
      imagenURL: null,
      proveedor: 'Banco de Crédito (BCP)',
      activo: true,
      cliente_id: clienteId,
      info_adicional_json: {
        origen: 'BCP',
        idPagoBCP: bcpData.idPago,
        moneda: 'PEN',
      },
    };
  }

  static toMisDeudas(bcpData) {
    return {
      id: `BCP-${bcpData.idPago}`,
      nombre: bcpData.nombreServicio || 'Servicio Desconocido',
      monto: bcpData.montoPendiente || bcpData.monto,
      fechaVencimiento: bcpData.fecha || new Date().toISOString(),
      estado: 'PENDIENTE',
      origen: 'BCP',
      logo: 'https://via.placeholder.com/50?text=BCP',
    };
  }
}

module.exports = BcpServicioMapper;
