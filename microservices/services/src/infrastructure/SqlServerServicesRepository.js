const Servicio = require('../domain/Servicio');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerServicesRepository {
  async createServicio(servicioData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('nombre', sql.NVarChar, servicioData.nombre)
        .input('descripcion', sql.NVarChar, servicioData.descripcion)
        .input('precio', sql.Decimal(10, 2), servicioData.precio)
        .input('duracion_estimada', sql.Int, servicioData.duracion_estimada)
        .input('categoria', sql.NVarChar, servicioData.categoria)
        .input('activo', sql.Bit, servicioData.activo)
        .query(`
          INSERT INTO servicios (nombre, descripcion, precio, duracion_estimada, categoria, activo)
          OUTPUT INSERTED.*
          VALUES (@nombre, @descripcion, @precio, @duracion_estimada, @categoria, @activo)
        `);

      const data = result.recordset[0];
      return new Servicio({
        id: data.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        duracionEstimada: data.duracion_estimada,
        categoria: data.categoria,
        activo: data.activo
      });
    } catch (error) {
      throw new Error(`Error creando servicio: ${error.message}`);
    }
  }

  async findServicioById(servicioId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.UniqueIdentifier, servicioId)
        .query('SELECT * FROM servicios WHERE id = @id');

      if (result.recordset.length === 0) {
        return null;
      }

      const data = result.recordset[0];
      return new Servicio({
        id: data.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        duracionEstimada: data.duracion_estimada,
        categoria: data.categoria,
        activo: data.activo
      });
    } catch (error) {
      throw new Error(`Error buscando servicio: ${error.message}`);
    }
  }

  async findAllServicios(filters = {}) {
    try {
      const pool = await getPool();
      let query = 'SELECT * FROM servicios WHERE 1=1';
      const request = pool.request();

      if (filters.activo !== undefined) {
        query += ' AND activo = @activo';
        request.input('activo', sql.Bit, filters.activo);
      }

      if (filters.categoria) {
        query += ' AND categoria = @categoria';
        request.input('categoria', sql.NVarChar, filters.categoria);
      }

      const result = await request.query(query);
      return result.recordset.map(item => new Servicio({
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        precio: item.precio,
        duracionEstimada: item.duracion_estimada,
        categoria: item.categoria,
        activo: item.activo
      }));
    } catch (error) {
      throw new Error(`Error obteniendo servicios: ${error.message}`);
    }
  }

  async updateServicio(servicioId, servicioData) {
    try {
      const pool = await getPool();

      const fields = [];
      const request = pool.request();
      request.input('id', sql.UniqueIdentifier, servicioId);

      if (servicioData.nombre !== undefined) {
        fields.push('nombre = @nombre');
        request.input('nombre', sql.NVarChar, servicioData.nombre);
      }
      if (servicioData.descripcion !== undefined) {
        fields.push('descripcion = @descripcion');
        request.input('descripcion', sql.NVarChar, servicioData.descripcion);
      }
      if (servicioData.precio !== undefined) {
        fields.push('precio = @precio');
        request.input('precio', sql.Decimal(10, 2), servicioData.precio);
      }
      if (servicioData.duracion_estimada !== undefined) {
        fields.push('duracion_estimada = @duracion_estimada');
        request.input('duracion_estimada', sql.Int, servicioData.duracion_estimada);
      }
      if (servicioData.categoria !== undefined) {
        fields.push('categoria = @categoria');
        request.input('categoria', sql.NVarChar, servicioData.categoria);
      }
      if (servicioData.activo !== undefined) {
        fields.push('activo = @activo');
        request.input('activo', sql.Bit, servicioData.activo);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      const result = await request.query(`
        UPDATE servicios
        SET ${fields.join(', ')}, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

      const data = result.recordset[0];
      return new Servicio({
        id: data.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        duracionEstimada: data.duracion_estimada,
        categoria: data.categoria,
        activo: data.activo
      });
    } catch (error) {
      throw new Error(`Error actualizando servicio: ${error.message}`);
    }
  }

  async deleteServicio(servicioId) {
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id', sql.UniqueIdentifier, servicioId)
        .query('DELETE FROM servicios WHERE id = @id');

      return true;
    } catch (error) {
      throw new Error(`Error eliminando servicio: ${error.message}`);
    }
  }
}

module.exports = SqlServerServicesRepository;
