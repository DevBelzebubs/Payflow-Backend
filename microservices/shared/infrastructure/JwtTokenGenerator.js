const jwt = require('jsonwebtoken');
const ITokenGenerator = require('../application/ports/ITokenGenerator');

class JwtTokenGenerator extends ITokenGenerator {
  constructor() {
    super();
    this.secret = process.env.JWT_SECRET;
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    if (!this.secret) {
      throw new Error('JWT_SECRET no está definido en .env');
    }
  }

  generate(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }
}

module.exports = JwtTokenGenerator;
