class Cliente {
  constructor({ id, fechaRegistro, usuarioId, nombre, correo, telefono, dni }) {
    this.id = id;
    this.fechaRegistro = fechaRegistro || new Date();
    this.usuarioId = usuarioId;
    this.nombre = nombre;
    this.correo = correo;
    this.telefono = telefono;
    this.dni = dni;
  }

  tieneDatosCompletos() {
    return !!(this.nombre && this.correo && this.dni);
  }

  toJSON() {
    return {
      id: this.id, fechaRegistro: this.fechaRegistro, usuarioId: this.usuarioId,
      nombre: this.nombre, correo: this.correo, telefono: this.telefono, dni: this.dni,
    };
  }
}

module.exports = Cliente;
