const Cliente = require('../domain/Cliente');
const Administrador = require('../domain/Administrador');

class SupabaseUsersRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async createCliente(clienteData) {
    const { data, error } = await this.supabase
      .from('clientes')
      .insert([clienteData])
      .select('*, usuarios(*)')
      .single();

    if (error) {
      throw new Error(`Error creando cliente: ${error.message}`);
    }

    return new Cliente({
      id: data.id,
      usuarioId: data.usuario_id,
      direccion: data.direccion,
      ciudad: data.ciudad,
      codigoPostal: data.codigo_postal,
      usuario: data.usuarios
    });
  }

  async findClienteByUsuarioId(usuarioId) {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*, usuarios(*)')
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error buscando cliente: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return new Cliente({
      id: data.id,
      usuarioId: data.usuario_id,
      direccion: data.direccion,
      ciudad: data.ciudad,
      codigoPostal: data.codigo_postal,
      usuario: data.usuarios
    });
  }

  async updateCliente(clienteId, clienteData) {
    const { data, error } = await this.supabase
      .from('clientes')
      .update(clienteData)
      .eq('id', clienteId)
      .select('*, usuarios(*)')
      .single();

    if (error) {
      throw new Error(`Error actualizando cliente: ${error.message}`);
    }

    return new Cliente({
      id: data.id,
      usuarioId: data.usuario_id,
      direccion: data.direccion,
      ciudad: data.ciudad,
      codigoPostal: data.codigo_postal,
      usuario: data.usuarios
    });
  }

  async findAllClientes() {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*, usuarios(*)');

    if (error) {
      throw new Error(`Error obteniendo clientes: ${error.message}`);
    }

    return data.map(item => new Cliente({
      id: item.id,
      usuarioId: item.usuario_id,
      direccion: item.direccion,
      ciudad: item.ciudad,
      codigoPostal: item.codigo_postal,
      usuario: item.usuarios
    }));
  }

  async createAdministrador(adminData) {
    const { data, error } = await this.supabase
      .from('administradores')
      .insert([adminData])
      .select('*, usuarios(*)')
      .single();

    if (error) {
      throw new Error(`Error creando administrador: ${error.message}`);
    }

    return new Administrador({
      id: data.id,
      usuarioId: data.usuario_id,
      nivelAcceso: data.nivel_acceso,
      usuario: data.usuarios
    });
  }

  async findAdministradorByUsuarioId(usuarioId) {
    const { data, error } = await this.supabase
      .from('administradores')
      .select('*, usuarios(*)')
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error buscando administrador: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return new Administrador({
      id: data.id,
      usuarioId: data.usuario_id,
      nivelAcceso: data.nivel_acceso,
      usuario: data.usuarios
    });
  }

  async findAllAdministradores() {
    const { data, error } = await this.supabase
      .from('administradores')
      .select('*, usuarios(*)');

    if (error) {
      throw new Error(`Error obteniendo administradores: ${error.message}`);
    }

    return data.map(item => new Administrador({
      id: item.id,
      usuarioId: item.usuario_id,
      nivelAcceso: item.nivel_acceso,
      usuario: item.usuarios
    }));
  }
}

module.exports = SupabaseUsersRepository;
