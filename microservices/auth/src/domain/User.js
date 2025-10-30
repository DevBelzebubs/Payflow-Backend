class User {
  constructor({ id, email, passwordHash, nombre, telefono, activo }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.nombre = nombre;
    this.telefono = telefono;
    this.activo = activo;
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
      activo: this.activo
    };
  }
}

module.exports = User;
