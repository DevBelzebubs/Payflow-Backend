class Administrador {
  constructor({ id, usuarioId, nivelAcceso, usuario }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.nivelAcceso = nivelAcceso;
    this.usuario = usuario;
  }

  toJSON() {
    return {
      id: this.id,
      usuarioId: this.usuarioId,
      nivelAcceso: this.nivelAcceso,
      usuario: this.usuario
    };
  }
}

module.exports = Administrador;
