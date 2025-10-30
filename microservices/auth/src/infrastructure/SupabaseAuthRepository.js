const IAuthRepository = require('../domain/IAuthRepository');
const User = require('../domain/User');

class SupabaseAuthRepository extends IAuthRepository {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  async findUserByEmail(email) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error(`Error buscando usuario: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return new User({
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      nombre: data.nombre,
      telefono: data.telefono,
      activo: data.activo
    });
  }

  async createUser(userData) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }

    return new User({
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      nombre: data.nombre,
      telefono: data.telefono,
      activo: data.activo
    });
  }

  async updateUser(userId, userData) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .update(userData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }

    return new User({
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      nombre: data.nombre,
      telefono: data.telefono,
      activo: data.activo
    });
  }
}

module.exports = SupabaseAuthRepository;
