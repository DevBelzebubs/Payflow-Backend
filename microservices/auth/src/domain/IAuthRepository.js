class IAuthRepository {
  async findUserByEmail(email) {
    throw new Error('Method not implemented');
  }

  async createUser(userData) {
    throw new Error('Method not implemented');
  }

  async updateUser(userId, userData) {
    throw new Error('Method not implemented');
  }
}

module.exports = IAuthRepository;
