const CuentaBancaria = require('../domain/CuentaBancaria');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerBankAccountsRepository {
  async createCuentaBancaria(cuentaData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('cliente_id', sql.UniqueIdentifier, cuentaData.cliente_id)
        .input('banco', sql.NVarChar, cuentaData.banco)
        .input('numero_cuenta', sql.NVarChar, cuentaData.numero_cuenta)
        .input('tipo_cuenta', sql.NVarChar, cuentaData.tipo_cuenta)
        .input('titular', sql.NVarChar, cuentaData.titular)
        .input('activo', sql.Bit, cuentaData.activo)
        .query(`
          INSERT INTO cuentas_bancarias (cliente_id, banco, numero_cuenta, tipo_cuenta, titular, activo)
          OUTPUT INSERTED.*
          VALUES (@cliente_id, @banco, @numero_cuenta, @tipo_cuenta, @titular, @activo)
        `);

      const data = result.recordset[0];
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
    } catch (error) {
      throw new Error(`Error creando cuenta bancaria: ${error.message}`);
    }
  }

  async findCuentaBancariaById(cuentaId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.UniqueIdentifier, cuentaId)
        .query('SELECT * FROM cuentas_bancarias WHERE id = @id');

      if (result.recordset.length === 0) {
        return null;
      }

      const data = result.recordset[0];
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
    } catch (error) {
      throw new Error(`Error buscando cuenta bancaria: ${error.message}`);
    }
  }

  async findCuentasByCliente(clienteId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('cliente_id', sql.UniqueIdentifier, clienteId)
        .query('SELECT * FROM cuentas_bancarias WHERE cliente_id = @cliente_id ORDER BY created_at DESC');

      return result.recordset.map(data => new CuentaBancaria({
        id: data.id,
        clienteId: data.cliente_id,
        banco: data.banco,
        numeroCuenta: data.numero_cuenta,
        tipoCuenta: data.tipo_cuenta,
        titular: data.titular,
        activo: data.activo,
        createdAt: data.created_at
      }));
    } catch (error) {
      throw new Error(`Error buscando cuentas bancarias: ${error.message}`);
    }
  }

  async updateCuentaBancaria(cuentaId, cuentaData) {
    try {
      const pool = await getPool();

      const fields = [];
      const request = pool.request();
      request.input('id', sql.UniqueIdentifier, cuentaId);

      if (cuentaData.banco !== undefined) {
        fields.push('banco = @banco');
        request.input('banco', sql.NVarChar, cuentaData.banco);
      }
      if (cuentaData.numero_cuenta !== undefined) {
        fields.push('numero_cuenta = @numero_cuenta');
        request.input('numero_cuenta', sql.NVarChar, cuentaData.numero_cuenta);
      }
      if (cuentaData.tipo_cuenta !== undefined) {
        fields.push('tipo_cuenta = @tipo_cuenta');
        request.input('tipo_cuenta', sql.NVarChar, cuentaData.tipo_cuenta);
      }
      if (cuentaData.titular !== undefined) {
        fields.push('titular = @titular');
        request.input('titular', sql.NVarChar, cuentaData.titular);
      }
      if (cuentaData.activo !== undefined) {
        fields.push('activo = @activo');
        request.input('activo', sql.Bit, cuentaData.activo);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      const result = await request.query(`
        UPDATE cuentas_bancarias
        SET ${fields.join(', ')}, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

      const data = result.recordset[0];
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
    } catch (error) {
      throw new Error(`Error actualizando cuenta bancaria: ${error.message}`);
    }
  }

  async deleteCuentaBancaria(cuentaId) {
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id', sql.UniqueIdentifier, cuentaId)
        .query('DELETE FROM cuentas_bancarias WHERE id = @id');

      return true;
    } catch (error) {
      throw new Error(`Error eliminando cuenta bancaria: ${error.message}`);
    }
  }
}

module.exports = SqlServerBankAccountsRepository;
