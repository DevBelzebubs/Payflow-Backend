class Money {
  constructor(amount, currency = 'PEN') {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      throw new Error(`Monto inválido: ${amount}`);
    }
    this.amount = parsed;
    this.currency = currency;
    Object.freeze(this);
  }

  add(other) {
    if (!(other instanceof Money)) {
      throw new Error('Solo se puede sumar Money con Money');
    }
    if (this.currency !== other.currency) {
      throw new Error(`No se pueden sumar monedas diferentes: ${this.currency} vs ${other.currency}`);
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other) {
    if (!(other instanceof Money)) {
      throw new Error('Solo se puede restar Money con Money');
    }
    if (this.currency !== other.currency) {
      throw new Error(`No se pueden restar monedas diferentes: ${this.currency} vs ${other.currency}`);
    }
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Saldo insuficiente');
    }
    return new Money(result, this.currency);
  }

  multiply(factor) {
    if (typeof factor !== 'number' || factor < 0) {
      throw new Error('Factor de multiplicación inválido');
    }
    return new Money(this.amount * factor, this.currency);
  }

  applyDiscount(percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Porcentaje de descuento inválido');
    }
    return new Money(this.amount * (1 - percentage / 100), this.currency);
  }

  isGreaterThan(other) {
    return this.amount > other.amount;
  }

  isLessThan(other) {
    return this.amount < other.amount;
  }

  toFloat() {
    return parseFloat(this.amount.toFixed(2));
  }

  toJSON() {
    return this.toFloat();
  }

  toString() {
    return `${this.currency} ${this.toFloat()}`;
  }
}

module.exports = Money;
