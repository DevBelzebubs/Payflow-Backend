class IPasswordHasher {
  async hash(plainPassword) {
    throw new Error('IPasswordHasher.hash() no implementado');
  }

  async compare(plainPassword, hashedPassword) {
    throw new Error('IPasswordHasher.compare() no implementado');
  }
}

module.exports = IPasswordHasher;
