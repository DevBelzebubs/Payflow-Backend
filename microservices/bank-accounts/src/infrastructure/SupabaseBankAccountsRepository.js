const CuentaBancaria = require('../domain/CuentaBancaria');

class SupabaseBankAccountsRepository {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async createCuentaBancaria(cuentaData) {
    const { data, error } = await this.supabase
      .from('cuentas_bancarias')
      .insert([cuentaData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando cuenta bancaria: ${error.message}`);
    }

    return new CuentaBancaria({
      id: data.id,
      clienteId: data.cliente_id,
      banco: data.banco,
      numeroCuenta: data.numero_cuenta,
      tipoCuenta: data.tipo_cuenta,
      titular: data.titular,
      activo: data.activo,
      createdAt: data.created_at
    });
  }

  async findCuentaBancariaById(cuentaId) {
    const { data, error } = await this.supabase
      .from('cuentas_bancarias')
      .select('*')
      .eq('id', cuentaId)
      .maybeSingle();

    if (error) {
      throw new Error(`Error buscando cuenta bancaria: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return new CuentaBancaria({
      id: data.id,
      clienteId: data.cliente_id,
      banco: data.banco,
      numeroCuenta: data.numero_cuenta,
      tipoCuenta: data.tipo_cuenta,
      titular: data.titular,
      activo: data.activo,
      createdAt: data.created_at
    });
  }

  async findCuentasByCliente(clienteId) {
    const { data, error } = await this.supabase
      .from('cuentas_bancarias')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error buscando cuentas bancarias: ${error.message}`);
    }

    return data.map(item => new CuentaBancaria({
      id: item.id,
      clienteId: item.cliente_id,
      banco: item.banco,
      numeroCuenta: item.numero_cuenta,
      tipoCuenta: item.tipo_cuenta,
      titular: item.titular,
      activo: item.activo,
      createdAt: item.created_at
    }));
  }

  async updateCuentaBancaria(cuentaId, cuentaData) {
    const { data, error } = await this.supabase
      .from('cuentas_bancarias')
      .update(cuentaData)
      .eq('id', cuentaId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando cuenta bancaria: ${error.message}`);
    }

    return new CuentaBancaria({
      id: data.id,
      clienteId: data.cliente_id,
      banco: data.banco,
      numeroCuenta: data.numero_cuenta,
      tipoCuenta: data.tipo_cuenta,
      titular: data.titular,
      activo: data.activo,
      createdAt: data.created_at
    });
  }

  async deleteCuentaBancaria(cuentaId) {
    const { error } = await this.supabase
      .from('cuentas_bancarias')
      .delete()
      .eq('id', cuentaId);

    if (error) {
      throw new Error(`Error eliminando cuenta bancaria: ${error.message}`);
    }

    return true;
  }
}

module.exports = SupabaseBankAccountsRepository;
