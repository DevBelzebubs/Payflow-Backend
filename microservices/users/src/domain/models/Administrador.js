class Administrador {
  constructor({ id, usuarioId, nivelAcceso, usuario }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.nivelAcceso = nivelAcceso;
    this.usuario = usuario;
  }

  esNivel(allowedLevels) {
    return allowedLevels.includes(this.nivelAcceso);
  }

  toJSON() {
    return { id: this.id, usuarioId: this.usuarioId, nivelAcceso: this.nivelAcceso, usuario: this.usuario };
  }
}

module.exports = Administrador;
