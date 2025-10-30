const Servicio = require('../domain/Servicio');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerServicesRepository {
  mapToDomain(dbData) {
    if (!dbData) return null;
    return new Servicio({
      idServicio: dbData.id,
      nombre: dbData.nombre,
      descripcion: dbData.descripcion,
      recibo: dbData.precio
    });
  }
  mapToDb(domainData) {
    const dbData = {};
    if (domainData.nombre !== undefined) dbData.nombre = domainData.nombre;
    if (domainData.descripcion !== undefined) dbData.descripcion = domainData.descripcion;
    if (domainData.recibo !== undefined) dbData.precio = domainData.recibo;
    return dbData;
  }
  async createServicio(servicioData) {
    try {
      const pool = await getPool();
      const dbMappedData = this.mapToDb(servicioData);

      const result = await pool
        .request()
        .input('nombre', sql.NVarChar, dbMappedData.nombre)
        .input('descripcion', sql.NVarChar, dbMappedData.descripcion)
        .input('precio', sql.Decimal(10, 2), dbMappedData.precio)
        .query(`
          INSERT INTO servicios (nombre, descripcion, precio) -- Columnas de la tabla
          OUTPUT INSERTED.*
          VALUES (@nombre, @descripcion, @precio)
        `);

      const data = result.recordset[0];
      return this.mapToDomain(data);
    } catch (error) {
      throw new Error(`Error creando servicio: ${error.message}`);
    }
  }

  async findServicioById(idServicio) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.UniqueIdentifier, idServicio)
        .query('SELECT * FROM servicios WHERE id = @id');

      if (result.recordset.length === 0) {
        return null;
      }

      const data = result.recordset[0];
      return this.mapToDomain(data);
    } catch (error) {
      throw new Error(`Error buscando servicio: ${error.message}`);
    }
  }

  async findAllServicios(filters = {}) {
    try {
      const pool = await getPool();
      let query = 'SELECT * FROM servicios WHERE 1=1';
      const request = pool.request();

      const result = await request.query(query);
      return result.recordset.map(item => this.mapToDomain(item));
    } catch (error) {
      throw new Error(`Error obteniendo servicios: ${error.message}`);
    }
  }

  async updateServicio(idServicio, servicioData) {
    try {
      const pool = await getPool();
      const dbMappedData = this.mapToDb(servicioData);

      const fields = [];
      const request = pool.request();
      request.input('id', sql.UniqueIdentifier, idServicio);

      if (dbMappedData.nombre !== undefined) {
        fields.push('nombre = @nombre');
        request.input('nombre', sql.NVarChar, dbMappedData.nombre);
      }
      if (dbMappedData.descripcion !== undefined) {
        fields.push('descripcion = @descripcion');
        request.input('descripcion', sql.NVarChar, dbMappedData.descripcion);
      }
      if (dbMappedData.precio !== undefined) {
        fields.push('precio = @precio');
        request.input('precio', sql.Decimal(10, 2), dbMappedData.precio);
      }

      if (fields.length === 0) {
        return await this.findServicioById(idServicio);
      }

      const result = await request.query(`
        UPDATE servicios
        SET ${fields.join(', ')}, updated_at = GETDATE() -- Asegúrate que updated_at exista
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

      const data = result.recordset[0];
      return this.mapToDomain(data);
    } catch (error) {
      throw new Error(`Error actualizando servicio: ${error.message}`);
    }
  }

  async deleteServicio(idServicio) {
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id', sql.UniqueIdentifier, idServicio)
        .query('DELETE FROM servicios WHERE id = @id');

      return true;
    } catch (error) {
      throw new Error(`Error eliminando servicio: ${error.message}`);
    }
  }
}

module.exports = SqlServerServicesRepository;
