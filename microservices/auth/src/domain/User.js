class User {
  constructor({ id, email, passwordHash, nombre, telefono, activo,rol, dni }) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.nombre = nombre;
    this.telefono = telefono;
    this.activo = activo;
    this.rol = rol;
    this.dni = dni;
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
      dni: this.dni
    };
  }
}

module.exports = User;
