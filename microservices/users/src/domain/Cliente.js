class Cliente {
  constructor({ id, fechaRegistro, usuarioId, nombre, correo, telefono }) {
    this.id = id;
    this.fechaRegistro = fechaRegistro;

    this.usuarioId = usuarioId;
    this.nombre = nombre;
    this.correo = correo;
    this.telefono = telefono;
  }

  toJSON() {
    return {
      id: this.id,
      fechaRegistro: this.fechaRegistro,
      usuarioId: this.usuarioId,
      nombre: this.nombre,
      correo: this.correo,
      telefono: this.telefono,
    };
  }
}

module.exports = Cliente;