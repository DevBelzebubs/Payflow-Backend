class Email {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('El email es requerido');
    }
    const normalized = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new Error(`Email inválido: ${value}`);
    }
    this.value = normalized;
    Object.freeze(this);
  }

  equals(other) {
    return other instanceof Email && this.value === other.value;
  }

  toString() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

module.exports = Email;
