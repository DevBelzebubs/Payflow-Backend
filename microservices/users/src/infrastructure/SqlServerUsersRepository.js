const Cliente = require('../domain/Cliente');
const Administrador = require('../domain/Administrador');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerUsersRepository {
  async createCliente(payflowUser) {
    try {
      const pool = await getPool();

      const resultCliente = await pool
        .request()
        .input('usuario_id', sql.UniqueIdentifier, payflowUser.id)
        .query(`
          INSERT INTO clientes (usuario_id) 
          OUTPUT INSERTED.id, INSERTED.usuario_id, INSERTED.created_at
          VALUES (@usuario_id)
        `);

      const dataCliente = resultCliente.recordset[0];

      return new Cliente({
        id: dataCliente.id,
        fechaRegistro: dataCliente.created_at,
        usuarioId: payflowUser.id,
        nombre: payflowUser.nombre,
        correo: payflowUser.email,
        telefono: payflowUser.telefono
      });

    } catch (error) {
      if (error.message.includes('UNIQUE KEY') || error.message.includes('FOREIGN KEY')) {
        throw new Error(`El usuario con ID ${payflowUser.id} ya es un cliente o no existe.`);
      }
      throw new Error(`Error creando cliente: ${error.message}`);
    }
  }

  async findClienteByUsuarioId(usuarioId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('usuario_id', sql.UniqueIdentifier, usuarioId)
        .query(`
          SELECT 
            c.id as id, 
            c.created_at as fechaRegistro,
            u.id as usuarioId,
            u.nombre,
            u.email as correo, -- Mapea email a correo
            u.telefono
          FROM 
            clientes c
          INNER JOIN 
            usuarios u ON c.usuario_id = u.id
          WHERE 
            u.id = @usuario_id
        `);

      if (result.recordset.length === 0) {
        return null;
      }

      const data = result.recordset[0];
      return new Cliente(data);

    } catch (error) {
      throw new Error(`Error buscando cliente: ${error.message}`);
    }
  }

  async updateCliente(clienteId, updateData) {
    try {
      const pool = await getPool();
      const clienteResult = await pool.request()
        .input('cliente_id', sql.UniqueIdentifier, clienteId)
        .query('SELECT usuario_id FROM clientes WHERE id = @cliente_id');

      if (clienteResult.recordset.length === 0) {
        throw new Error('Cliente no encontrado');
      }
      const usuarioId = clienteResult.recordset[0].usuario_id;

      const fields = [];
      const request = pool.request();
      request.input('usuario_id', sql.UniqueIdentifier, usuarioId);

      if (updateData.nombre !== undefined) {
        fields.push('nombre = @nombre');
        request.input('nombre', sql.NVarChar, updateData.nombre);
      }
      if (updateData.telefono !== undefined) {
        fields.push('telefono = @telefono');
        request.input('telefono', sql.NVarChar, updateData.telefono);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      await request.query(`
        UPDATE usuarios
        SET ${fields.join(', ')}, updated_at = GETDATE()
        WHERE id = @usuario_id
      `);

      return await this.findClienteByUsuarioId(usuarioId);

    } catch (error) {
      throw new Error(`Error actualizando cliente: ${error.message}`);
    }
  }

  async findAllClientes() {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT 
          c.id as id, 
          c.created_at as fechaRegistro,
          u.id as usuarioId,
          u.nombre,
          u.email as correo,
          u.telefono
        FROM 
          clientes c
        INNER JOIN 
          usuarios u ON c.usuario_id = u.id
      `);

      return result.recordset.map(data => new Cliente(data));
    } catch (error) {
      throw new Error(`Error obteniendo clientes: ${error.message}`);
    }
  }

  async createAdministrador(adminData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('usuario_id', sql.UniqueIdentifier, adminData.usuario_id)
        .input('nivel_acceso', sql.NVarChar, adminData.nivel_acceso)
        .query(`
          INSERT INTO administradores (usuario_id, nivel_acceso)
          OUTPUT INSERTED.*
          VALUES (@usuario_id, @nivel_acceso)
        `);

      const data = result.recordset[0];

      const usuario = await pool
        .request()
        .input('id', sql.UniqueIdentifier, data.usuario_id)
        .query('SELECT * FROM usuarios WHERE id = @id');

      return new Administrador({
        id: data.id,
        usuarioId: data.usuario_id,
        nivelAcceso: data.nivel_acceso,
        usuario: usuario.recordset[0]
      });
    } catch (error) {
      throw new Error(`Error creando administrador: ${error.message}`);
    }
  }

  async findAdministradorByUsuarioId(usuarioId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('usuario_id', sql.UniqueIdentifier, usuarioId)
        .query(`
          SELECT a.*, u.email, u.nombre, u.telefono, u.activo
          FROM administradores a
          INNER JOIN usuarios u ON a.usuario_id = u.id
          WHERE a.usuario_id = @usuario_id
        `);

      if (result.recordset.length === 0) {
        return null;
      }

      const data = result.recordset[0];
      return new Administrador({
        id: data.id,
        usuarioId: data.usuario_id,
        nivelAcceso: data.nivel_acceso,
        usuario: {
          id: data.usuario_id,
          email: data.email,
          nombre: data.nombre,
          telefono: data.telefono,
          activo: data.activo
        }
      });
    } catch (error) {
      throw new Error(`Error buscando administrador: ${error.message}`);
    }
  }

  async findAllAdministradores() {
    try {
      const pool = await getPool();
      const result = await pool.request().query(`
        SELECT a.*, u.email, u.nombre, u.telefono, u.activo
        FROM administradores a
        INNER JOIN usuarios u ON a.usuario_id = u.id
      `);

      return result.recordset.map(data => new Administrador({
        id: data.id,
        usuarioId: data.usuario_id,
        nivelAcceso: data.nivel_acceso,
        usuario: {
          id: data.usuario_id,
          email: data.email,
          nombre: data.nombre,
          telefono: data.telefono,
          activo: data.activo
        }
      }));
    } catch (error) {
      throw new Error(`Error obteniendo administradores: ${error.message}`);
    }
  }
}

module.exports = SqlServerUsersRepository;
