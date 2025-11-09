const Servicio = require('../domain/Servicio');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerServicesRepository {
  mapToDomain(dbData) {
    if (!dbData) return null;
    return new Servicio({
      idServicio: dbData.id,
      nombre: dbData.nombre,
      descripcion: dbData.descripcion,
      recibo: dbData.precio,
      estado: dbData.estado,
      imagenUrl: dbData.imagen_url
    });
  }

  mapToDb(domainData) {
    const dbData = {};
    if (domainData.nombre !== undefined) dbData.nombre = domainData.nombre;
    if (domainData.descripcion !== undefined) dbData.descripcion = domainData.descripcion;
    if (domainData.recibo !== undefined) dbData.precio = domainData.recibo;
    if (domainData.estado !== undefined) dbData.estado = domainData.estado;
    if (domainData.imagenUrl !== undefined) dbData.imagen_url = domainData.imagenUrl;
    return dbData;
  }

  async createServicio(servicioData) {
    try {
      const pool = await getPool();
      const dbMappedData = this.mapToDb(servicioData);

      const hasImage = dbMappedData.imagen_url !== undefined;
      
      let query = `
        INSERT INTO servicios (nombre, descripcion, precio ${hasImage ? ', imagen_url' : ''})
        OUTPUT INSERTED.*
        VALUES (@nombre, @descripcion, @precio ${hasImage ? ', @imagen_url' : ''})
      `;

      const request = pool.request()
        .input('nombre', sql.NVarChar, dbMappedData.nombre)
        .input('descripcion', sql.NVarChar, dbMappedData.descripcion)
        .input('precio', sql.Decimal(10, 2), dbMappedData.precio);

      if (hasImage) {
        request.input('imagen_url', sql.NVarChar, dbMappedData.imagen_url);
      }
      
      const result = await request.query(query);

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
      if (dbMappedData.estado !== undefined) {
        fields.push('estado = @estado');
        request.input('estado', sql.NVarChar, dbMappedData.estado);
      }
      
      // <-- AJUSTE 4: Añadir lógica de actualización para imagen_url
      if (dbMappedData.imagen_url !== undefined) {
        fields.push('imagen_url = @imagen_url');
        request.input('imagen_url', sql.NVarChar, dbMappedData.imagen_url);
      }

      if (fields.length === 0) {
        return await this.findServicioById(idServicio);
      }

      const result = await request.query(`
        UPDATE servicios
        SET ${fields.join(', ')}, updated_at = GETDATE()
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