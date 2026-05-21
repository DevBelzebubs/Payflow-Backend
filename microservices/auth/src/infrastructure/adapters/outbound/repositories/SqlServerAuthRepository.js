const IAuthRepositoryPort = require('../../../../domain/ports/outbound/IAuthRepositoryPort');
const UserMapper = require('../../../mappers/UserMapper');
const { getPool, sql } = require('../../../../../../../database/sqlServerConfig');

class SqlServerAuthRepository extends IAuthRepositoryPort {
  async findByEmail(email) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('email', sql.NVarChar, email)
        .query('SELECT * FROM usuarios WHERE email = @email');
      if (result.recordset.length === 0) return null;
      return UserMapper.toDomain(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error buscando usuario: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query('SELECT * FROM usuarios WHERE id = @id');
      if (result.recordset.length === 0) return null;
      return UserMapper.toDomain(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error buscando usuario por ID: ${error.message}`);
    }
  }

  async create(userData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('email', sql.NVarChar, userData.email)
        .input('password_hash', sql.NVarChar, userData.password_hash)
        .input('nombre', sql.NVarChar, userData.nombre)
        .input('telefono', sql.NVarChar, userData.telefono)
        .input('activo', sql.Bit, userData.activo)
        .input('dni', sql.NVarChar, userData.dni)
        .input('rol', sql.NVarChar, userData.rol)
        .query(`
          INSERT INTO usuarios (email, password_hash, nombre, telefono, activo, dni, rol)
          OUTPUT INSERTED.*
          VALUES (@email, @password_hash, @nombre, @telefono, @activo, @dni, @rol)
        `);
      return UserMapper.toDomain(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }
  }

  async update(userId, userData) {
    try {
      const pool = await getPool();
      const setClauses = [];
      const request = pool.request().input('id', sql.UniqueIdentifier, userId);
      for (const [key, value] of Object.entries(userData)) {
        setClauses.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, value);
      }
      if (setClauses.length === 0) return null;
      const query = `UPDATE usuarios SET ${setClauses.join(', ')} OUTPUT INSERTED.* WHERE id = @id`;
      const result = await request.query(query);
      if (result.recordset.length === 0) return null;
      return UserMapper.toDomain(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }
  }

  async findAdminLevelByUsuarioId(usuarioId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('usuarioId', sql.UniqueIdentifier, usuarioId)
        .query('SELECT nivel_acceso FROM administradores WHERE usuario_id = @usuarioId');
      return result.recordset.length > 0 ? result.recordset[0].nivel_acceso : null;
    } catch (error) {
      throw new Error(`Error buscando nivel de admin: ${error.message}`);
    }
  }

  async findClienteIdByUsuarioId(usuarioId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('usuarioId', sql.UniqueIdentifier, usuarioId)
        .query('SELECT id FROM clientes WHERE usuario_id = @usuarioId');
      return result.recordset.length > 0 ? result.recordset[0].id : null;
    } catch (error) {
      throw new Error(`Error buscando clienteId: ${error.message}`);
    }
  }

}

module.exports = SqlServerAuthRepository;
