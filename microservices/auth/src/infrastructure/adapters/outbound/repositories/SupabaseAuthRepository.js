const IAuthRepositoryPort = require('../../../../domain/ports/outbound/IAuthRepositoryPort');
const UserMapper = require('../../../mappers/UserMapper');

class SupabaseAuthRepository extends IAuthRepositoryPort {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async findByEmail(email) {
    const { data, error } = await this.supabase
      .from('usuarios').select('*').eq('email', email).maybeSingle();
    if (error) throw new Error(`Error buscando usuario: ${error.message}`);
    if (!data) return null;
    return UserMapper.toDomain(data);
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from('usuarios').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Error buscando usuario: ${error.message}`);
    if (!data) return null;
    return UserMapper.toDomain(data);
  }

  async create(userData) {
    const { data, error } = await this.supabase
      .from('usuarios').insert([userData]).select().single();
    if (error) throw new Error(`Error creando usuario: ${error.message}`);
    return UserMapper.toDomain(data);
  }

  async update(userId, userData) {
    const { data, error } = await this.supabase
      .from('usuarios').update(userData).eq('id', userId).select().single();
    if (error) throw new Error(`Error actualizando usuario: ${error.message}`);
    return UserMapper.toDomain(data);
  }

  async findAdminLevelByUsuarioId(usuarioId) { return null; }

  async findClienteIdByUsuarioId(usuarioId) { return null; }
}

module.exports = SupabaseAuthRepository;
