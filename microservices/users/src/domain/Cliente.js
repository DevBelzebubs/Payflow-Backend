class Cliente {
  constructor({ id, fechaRegistro, usuarioId, nombre, correo, telefono,dni }) {
    this.id = id;
    this.fechaRegistro = fechaRegistro;

    this.usuarioId = usuarioId;
    this.nombre = nombre;
    this.correo = correo;
    this.telefono = telefono;
    this.dni = dni;
  }

  toJSON() {
    return {
      id: this.id,
      fechaRegistro: this.fechaRegistro,
      usuarioId: this.usuarioId,
      nombre: this.nombre,
      correo: this.correo,
      telefono: this.telefono,
      dni: this.dni,
    };
  }
}

module.exports = Cliente;