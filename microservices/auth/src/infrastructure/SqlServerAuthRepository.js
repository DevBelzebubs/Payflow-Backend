const IAuthRepository = require('../domain/IAuthRepository');
const User = require('../domain/User');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerAuthRepository extends IAuthRepository {
  async findUserByEmail(email) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('email', sql.NVarChar, email)
        .query('SELECT * FROM usuarios WHERE email = @email');

      if (result.recordset.length === 0) {
        return null;
      }

      const data = result.recordset[0];
      return new User({
        id: data.id,
        email: data.email,
        passwordHash: data.password_hash,
        nombre: data.nombre,
        telefono: data.telefono,
        activo: data.activo
      });
    } catch (error) {
      throw new Error(`Error buscando usuario: ${error.message}`);
    }
  }

  async createUser(userData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('email', sql.NVarChar, userData.email)
        .input('password_hash', sql.NVarChar, userData.password_hash)
        .input('nombre', sql.NVarChar, userData.nombre)
        .input('telefono', sql.NVarChar, userData.telefono)
        .input('activo', sql.Bit, userData.activo)
        .query(`
          INSERT INTO usuarios (email, password_hash, nombre, telefono, activo)
          OUTPUT INSERTED.*
          VALUES (@email, @password_hash, @nombre, @telefono, @activo)
        `);

      const data = result.recordset[0];
      return new User({
        id: data.id,
        email: data.email,
        passwordHash: data.password_hash,
        nombre: data.nombre,
        telefono: data.telefono,
        activo: data.activo
      });
    } catch (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }
  }

  async updateUser(userId, userData) {
    try {
      const pool = await getPool();

      const fields = [];
      const request = pool.request();
      request.input('id', sql.UniqueIdentifier, userId);

      if (userData.email !== undefined) {
        fields.push('email = @email');
        request.input('email', sql.NVarChar, userData.email);
      }
      if (userData.nombre !== undefined) {
        fields.push('nombre = @nombre');
        request.input('nombre', sql.NVarChar, userData.nombre);
      }
      if (userData.telefono !== undefined) {
        fields.push('telefono = @telefono');
        request.input('telefono', sql.NVarChar, userData.telefono);
      }
      if (userData.activo !== undefined) {
        fields.push('activo = @activo');
        request.input('activo', sql.Bit, userData.activo);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      const result = await request.query(`
        UPDATE usuarios
        SET ${fields.join(', ')}, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

      const data = result.recordset[0];
      return new User({
        id: data.id,
        email: data.email,
        passwordHash: data.password_hash,
        nombre: data.nombre,
        telefono: data.telefono,
        activo: data.activo
      });
    } catch (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }
  }
}

module.exports = SqlServerAuthRepository;
