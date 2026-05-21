class Phone {
  constructor(value) {
    if (!value) {
      this.value = null;
      Object.freeze(this);
      return;
    }
    const normalized = value.trim();
    const phoneRegex = /^\+?\d{7,15}$/;
    if (!phoneRegex.test(normalized.replace(/[\s-]/g, ''))) {
      throw new Error(`Teléfono inválido: ${value}`);
    }
    this.value = normalized;
    Object.freeze(this);
  }

  equals(other) {
    return other instanceof Phone && this.value === other.value;
  }

  toString() {
    return this.value || '';
  }

  isEmpty() {
    return this.value === null;
  }

  toJSON() {
    return this.value;
  }
}

module.exports = Phone;
