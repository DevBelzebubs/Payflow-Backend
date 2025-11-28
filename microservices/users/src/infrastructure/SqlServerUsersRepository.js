const Cliente = require('../domain/Cliente');
const Administrador = require('../domain/Administrador');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerUsersRepository {
  async createCliente(data) {
    try {
      const pool = await getPool();
      const usuarioId = data.id || data.usuario_id;
      if (!usuarioId) {
        throw new Error("No se pudo determinar el usuario_id para crear el cliente.");
      }
      const resultCliente = await pool
        .request()
        .input('usuario_id', sql.UniqueIdentifier, usuarioId)
        .query(`
          INSERT INTO clientes (usuario_id) 
          OUTPUT INSERTED.id, INSERTED.usuario_id, INSERTED.created_at
          VALUES (@usuario_id)
        `);

      const dataCliente = resultCliente.recordset[0];
      let userData = data;
      if (!userData.nombre){
        const userResult = await pool.request().input('id',sql.UniqueIdentifier,usuarioId).query("SELECT* FROM usuarios WHERE id = @id");
        if (userResult.recordset.length === 0) {
          throw new Error("El usuario_id insertado no se encontró en la tabla de usuarios.");
        }
        userData = userResult.recordset[0];
      }
      return new Cliente({
        id: dataCliente.id,
        fechaRegistro: dataCliente.created_at,
        usuarioId: usuarioId,
        nombre: userData.nombre,
        correo: userData.email,
        telefono: userData.telefono,
        dni: userData.dni
      });

    } catch (error) {
      const usuarioId = data.id || data.usuario_id;
      if (error.message.includes('UNIQUE KEY') || error.message.includes('FOREIGN KEY')) {
        throw new Error(`El usuario con ID ${usuarioId} ya es un cliente o no existe.`);
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
            u.telefono,
            u.dni
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
  async findUserById(id) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.UniqueIdentifier, id)
        .query('SELECT * FROM usuarios WHERE id = @id');

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
        activo: data.activo,
        rol: data.rol,
        dni: data.dni,
        avatar_url: data.avatar_url,
        banner_url: data.banner_url
      });
    } catch (error) {
      throw new Error(`Error buscando usuario por ID: ${error.message}`);
    }
  }
  async updateUser(usuarioId, updateData) {
    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('id', sql.UniqueIdentifier, usuarioId);

      const fields = [];

      if (updateData.nombre !== undefined) {
        fields.push('nombre = @nombre');
        request.input('nombre', sql.NVarChar, updateData.nombre);
      }
      if (updateData.telefono !== undefined) {
        fields.push('telefono = @telefono');
        request.input('telefono', sql.NVarChar, updateData.telefono);
      }
      if (updateData.email !== undefined) {
        fields.push('email = @email');
        request.input('email', sql.NVarChar, updateData.email);
      }
      if (updateData.avatar_url !== undefined) {
        fields.push('avatar_url = @avatar_url');
        request.input('avatar_url', sql.NVarChar, updateData.avatar_url);
      }
      if (updateData.banner_url !== undefined) {
        fields.push('banner_url = @banner_url');
        request.input('banner_url', sql.NVarChar, updateData.banner_url);
      }
      
      if (updateData.password_hash !== undefined) {
        fields.push('password_hash = @password_hash');
        request.input('password_hash', sql.NVarChar, updateData.password_hash);
      }

      if (fields.length === 0) {
        return null;
      }

      const query = `
        UPDATE usuarios
        SET ${fields.join(', ')}, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `;

      const result = await request.query(query);
      
      if (result.recordset.length === 0) return null;

      return result.recordset[0];

    } catch (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }
  }
  async createSuscripcion(data){
    try {
      const pool = await getPool();
      const proximoPago = new Date();
      proximoPago.setMonth(proximoPago.getMonth() + 1);
      await pool.request().input('cliente_id', sql.UniqueIdentifier, data.clienteId)
        .input('servicio_id', sql.UniqueIdentifier, data.servicioId)
        .input('precio', sql.Decimal(10, 2), data.precio)
        .input('cuenta_origen', sql.UniqueIdentifier, data.cuentaId || null)
        .input('prox_pago', sql.DateTime2, proximoPago)
        .query(`
          INSERT INTO suscripciones_cliente 
          (cliente_id, servicio_id, precio_acordado, cuenta_origen_id, fecha_proximo_pago)
          VALUES (@cliente_id, @servicio_id, @precio, @cuenta_origen, @prox_pago)
        `);
    } catch (error) {
      console.error("Error creando registro de suscripción:", error);
      return false;
    }
  }
  async findSuscripcionesParaRenovar(){
    try {
      const pool = await getPool();
      const result = await pool.request().query(`SELECT s.* ser.nombre as nombre_servicio 
          FROM suscripciones_cliente s
          INNER JOIN servicios ser ON s.servicio_id = ser.id
          WHERE s.estado = 'ACTIVA' 
          AND s.fecha_proximo_pago <= GETDATE()`);
      return result.recordset
    } catch (error) {
      throw new Error(`Error buscando renovaciones: ${error.message}`);
    }
  }
  async updateProximoPagoSuscripciones(suscripcionId){
    try {
      const pool = await getPool();
      const nuevoPago = new Date();
      nuevoPago.setMonth(nuevoPago.getMonth() + 1);
      await pool,request()
      .input('id',sql.UniqueIdentifier,suscripcionId)
      .input('nuevo_pago',sql.UniqueIdentifier,nuevoPago)
      .query(`UPDATE suscripciones_cliente SET fecha_ultimo_pago = GETDATE(),fecha_proximo_pago = @nuevo_pago WHERE id = @id`);
    } catch (error) {
      throw new Error(`Error actualizando suscripción: ${error.message}`);
    }
  }
}

module.exports = SqlServerUsersRepository;
