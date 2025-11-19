class User {
  constructor({ id, email, passwordHash, nombre, telefono, activo,rol, dni,avatar_url, banner_url }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.nombre = nombre;
    this.telefono = telefono;
    this.activo = activo;
    this.rol = rol;
    this.dni = dni;
    this.avatar_url = avatar_url;
    this.banner_url = banner_url;
  }

  isActive() {
    return this.activo === true;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      nombre: this.nombre,
      telefono: this.telefono,
      activo: this.activo,
      rol: this.rol,
      dni: this.dni,
      avatar_url: this.avatar_url,
      banner_url: this.banner_url
    };
  }
}

module.exports = User;
