class ITokenGenerator {
  generate(payload) {
    throw new Error('ITokenGenerator.generate() no implementado');
  }

  verify(token) {
    throw new Error('ITokenGenerator.verify() no implementado');
  }
}

module.exports = ITokenGenerator;
