const Cliente = require('../../domain/models/Cliente');

class ClienteMapper {
  static toDomain(data) {
    if (!data) return null;
    return new Cliente({
      id: data.id,
      fechaRegistro: data.fechaRegistro || data.created_at,
      usuarioId: data.usuarioId || data.usuario_id,
      nombre: data.nombre,
      correo: data.correo || data.email,
      telefono: data.telefono,
      dni: data.dni,
    });
  }

  static toPersistence(cliente) {
    return {
      id: cliente.id,
      usuario_id: cliente.usuarioId,
      nombre: cliente.nombre,
      correo: cliente.correo,
      telefono: cliente.telefono,
      dni: cliente.dni,
    };
  }
}

module.exports = ClienteMapper;
