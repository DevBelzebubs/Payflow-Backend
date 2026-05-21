const Administrador = require('../../domain/models/Administrador');

class AdministradorMapper {
  static toDomain(data) {
    if (!data) return null;
    return new Administrador({
      id: data.id,
      usuarioId: data.usuario_id || data.usuarioId,
      nivelAcceso: data.nivel_acceso || data.nivelAcceso,
      usuario: data.usuario
        ? data.usuario
        : data.email
          ? {
              id: data.usuario_id,
              email: data.email,
              nombre: data.nombre,
              telefono: data.telefono,
              activo: data.activo,
            }
          : null,
    });
  }

  static toPersistence(admin) {
    return {
      id: admin.id,
      usuario_id: admin.usuarioId,
      nivel_acceso: admin.nivelAcceso,
    };
  }
}

module.exports = AdministradorMapper;
