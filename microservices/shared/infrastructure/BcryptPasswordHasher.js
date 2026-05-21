const bcrypt = require('bcryptjs');
const IPasswordHasher = require('../application/ports/IPasswordHasher');

class BcryptPasswordHasher extends IPasswordHasher {
  async hash(plainPassword) {
    return await bcrypt.hash(plainPassword, 10);
  }

  async compare(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = BcryptPasswordHasher;
