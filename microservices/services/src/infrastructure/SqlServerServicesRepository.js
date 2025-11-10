const Servicio = require('../domain/Servicio');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

const serviceFields = [
  'nombre', 'descripcion', 'precio', 'estado', 'imagen_url', 
  'tipo_servicio', 'sinopsis', 'fecha_evento', 'video_url', 
  'proveedor', 'rating', 'info_adicional_json'
];
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
      info_adicional_json: dbData.info_adicional_json ? JSON.parse(dbData.info_adicional_json) : null
    });
  }

  mapToDb(domainData) {
    const dbData = {};
    if (domainData.nombre !== undefined) dbData.nombre = domainData.nombre;
    if (domainData.descripcion !== undefined) dbData.descripcion = domainData.descripcion;
    if (domainData.recibo !== undefined) dbData.precio = domainData.recibo;
    if (domainData.estado !== undefined) dbData.estado = domainData.estado;
    if (domainData.imagenUrl !== undefined) dbData.imagen_url = domainData.imagenUrl;
    if (domainData.recibo !== undefined) dbData.precio = domainData.recibo;
    const fieldsToMap = [
      'nombre', 'descripcion', 'estado', 'imagen_url', 
      'tipo_servicio', 'sinopsis', 'fecha_evento', 'video_url', 
      'proveedor', 'rating'
    ];

    fieldsToMap.forEach(field => {
      if (domainData[field] !== undefined) dbData[field] = domainData[field];
    });

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
      const hasImage = dbMappedData.imagen_url !== undefined;
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
        request.input(col, type, dbMappedData[col]);
      });       
      
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

      Object.keys(dbMappedData).forEach(col => {
        fields.push(`${col} = @${col}`);
        
        let type = sql.NVarChar;
        if (col === 'precio') type = sql.Decimal(10, 2);
        if (col === 'rating') type = sql.Decimal(3, 2);
        if (col === 'fecha_evento') type = sql.DateTime2;
        
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