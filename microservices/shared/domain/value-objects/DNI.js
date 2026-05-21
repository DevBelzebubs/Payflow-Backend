class DNI {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('El DNI es requerido');
    }
    const normalized = value.trim();
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(normalized)) {
      throw new Error(`DNI inválido: debe tener 8 dígitos numéricos`);
    }
    this.value = normalized;
    Object.freeze(this);
  }

  equals(other) {
    return other instanceof DNI && this.value === other.value;
  }

  toString() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

module.exports = DNI;
