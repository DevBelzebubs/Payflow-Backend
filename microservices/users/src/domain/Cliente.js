class Cliente {
  constructor({ id, fechaRegistro ,usuarioId, nombre, correo, dni, direccion,telefono }) {
    this.id = id;
    this.fechaRegistro = fechaRegistro;

    this.usuarioId = usuarioId;
    this.nombre = nombre;
    this.correo = correo;
    this.dni = dni;
    this.direccion = direccion;
    this.telefono = telefono;
  }

  toJSON() {
    return {
      id: this.id,
      fechaRegistro: this.fechaRegistro,
      usuarioId: this.usuarioId,
      nombre: this.nombre,
      correo: this.correo,
      dni: this.dni,
      direccion: this.direccion,
      telefono: this.telefono,
    };
  }
}

module.exports = Cliente;
