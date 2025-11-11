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
      imagenURL: dbData.imagen_url,
      activo: dbData.activo,
      tipo_servicio: dbData.tipo_servicio,
      sinopsis: dbData.sinopsis,
      fecha_evento: dbData.fecha_evento,
      video_url: dbData.video_url,
      proveedor: dbData.proveedor,
      rating: dbData.rating,
      info_adicional_json: dbData.info_adicional_json ? JSON.parse(dbData.info_adicional_json) : null,
      cliente_id: dbData.cliente_id
    });
  }

  mapToDb(domainData) {
    const dbData = {};
    if (domainData.nombre !== undefined) dbData.nombre = domainData.nombre;
    if (domainData.descripcion !== undefined) dbData.descripcion = domainData.descripcion;
    if (domainData.recibo !== undefined) dbData.precio = domainData.recibo;
    if (domainData.estado !== undefined) dbData.estado = domainData.estado;
    if (domainData.imagenURL !== undefined) dbData.imagen_url = domainData.imagenURL; 
    if (domainData.activo !== undefined) dbData.activo = domainData.activo;
    if (domainData.tipo_servicio !== undefined) dbData.tipo_servicio = domainData.tipo_servicio;
    if (domainData.sinopsis !== undefined) dbData.sinopsis = domainData.sinopsis;
    if (domainData.fecha_evento !== undefined) dbData.fecha_evento = domainData.fecha_evento;
    if (domainData.video_url !== undefined) dbData.video_url = domainData.video_url;
    if (domainData.proveedor !== undefined) dbData.proveedor = domainData.proveedor;
    if (domainData.rating !== undefined) dbData.rating = domainData.rating;
    if (domainData.cliente_id !== undefined) dbData.cliente_id = domainData.cliente_id;
    
    if (domainData.info_adicional_json !== undefined) {
      dbData.info_adicional_json = JSON.stringify(domainData.info_adicional_json);
    }
    return dbData;
  }

  async createServicio(servicioData) {
    try {
      const pool = await getPool();
      const dbMappedData = this.mapToDb(servicioData);
      
      const columns = Object.keys(dbMappedData);
      const values = columns.map(col => `@${col}`);

      let query = `
        INSERT INTO servicios (${columns.join(', ')})
        OUTPUT INSERTED.*
        VALUES (${values.join(', ')})
      `;

      const request = pool.request();
      
      columns.forEach(col => {
        let type = sql.NVarChar;
        if (col === 'precio') type = sql.Decimal(10, 2);
        if (col === 'rating') type = sql.Decimal(3, 2);
        if (col === 'fecha_evento') type = sql.DateTime2;
        if (col === 'activo') type = sql.Bit;
        if (col === 'cliente_id') type = sql.UniqueIdentifier;
        
        request.input(col, type, dbMappedData[col]);
      });
      
      const result = await request.query(query);
      return this.mapToDomain(result.recordset[0]);

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
      return this.mapToDomain(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error buscando servicio: ${error.message}`);
    }
  }

  async findAllServicios(filters = {}) {
    try {
      const pool = await getPool();
      let query = 'SELECT * FROM servicios WHERE activo = 1'; 
      const request = pool.request();

      if (filters.clienteId) {
        query += ' AND (cliente_id IS NULL OR cliente_id = @cliente_id)';
        request.input('cliente_id', sql.UniqueIdentifier, filters.clienteId);
      } else {
        query += ' AND cliente_id IS NULL';
      }
      
      if (filters.tipo_servicio) {
         query += ' AND tipo_servicio = @tipo_servicio';
         request.input('tipo_servicio', sql.NVarChar, filters.tipo_servicio);
      }

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
      
      Object.keys(dbMappedData).forEach(col => {
        fields.push(`${col} = @${col}`);
        
        let type = sql.NVarChar;
        if (col === 'precio') type = sql.Decimal(10, 2);
        if (col === 'rating') type = sql.Decimal(3, 2);
        if (col === 'fecha_evento') type = sql.DateTime2;
        if (col === 'activo') type = sql.Bit;
        if (col === 'cliente_id') type = sql.UniqueIdentifier;

        request.input(col, type, dbMappedData[col]);
      });

      if (fields.length === 0) {
        return await this.findServicioById(idServicio);
      }

      const result = await request.query(`
        UPDATE servicios
        SET ${fields.join(', ')}, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

      return this.mapToDomain(result.recordset[0]);
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