const User = require('../../domain/models/User');

class UserMapper {
  static toDomain(data) {
    if (!data) return null;
    return new User({
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      nombre: data.nombre,
      telefono: data.telefono,
      activo: data.activo,
      dni: data.dni,
      rol: data.rol,
      avatar_url: data.avatar_url,
      banner_url: data.banner_url,
    });
  }

  static toPersistence(user) {
    return {
      id: user.id,
      email: user.email.toString(),
      password_hash: user.passwordHash,
      nombre: user.nombre,
      telefono: user.telefono ? user.telefono.toString() : null,
      activo: user.activo,
      dni: user.dni ? user.dni.toString() : null,
      rol: user.rol,
      avatar_url: user.avatar_url,
      banner_url: user.banner_url,
    };
  }

  static toDTO(user) {
    return user ? user.toJSON() : null;
  }
}

module.exports = UserMapper;
