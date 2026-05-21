const IServicesRepositoryPort = require('../../../../domain/ports/outbound/IServicesRepositoryPort');
const Servicio = require('../../../../domain/models/Servicio');
const { getPool, sql } = require('../../../../../../../database/sqlServerConfig');
const ServicioMapper = require('../../../mappers/ServicioMapper');

class SqlServerServicesRepository extends IServicesRepositoryPort {

  async createServicio(servicioData) {
    try {
      const pool = await getPool();
      const dbMappedData = ServicioMapper.toPersistence(servicioData);

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
      return ServicioMapper.toDomain(result.recordset[0]);

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
      return ServicioMapper.toDomain(result.recordset[0]);
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
      return result.recordset.map(item => ServicioMapper.toDomain(item));
    } catch (error) {
      throw new Error(`Error obteniendo servicios: ${error.message}`);
    }
  }

  async updateServicio(idServicio, servicioData) {
    try {
      const pool = await getPool();
      const dbMappedData = ServicioMapper.toPersistence(servicioData);

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

      return ServicioMapper.toDomain(result.recordset[0]);
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

  async findOccupiedSeats(idServicio) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('servicio_id', sql.UniqueIdentifier, idServicio)
        .query('SELECT fila as row, columna as col FROM butacas_reservadas WHERE servicio_id = @servicio_id');

      return result.recordset;
    } catch (error) {
      throw new Error(`Error obteniendo butacas: ${error.message}`);
    }
  }

  async findTicketTypesByServiceId(idServicio) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('servicio_id', sql.UniqueIdentifier, idServicio)
        .query('SELECT * FROM tipos_entrada WHERE servicio_id = @servicio_id');

      return result.recordset;
    } catch (error) {
      throw new Error(`Error obteniendo tipos de entrada: ${error.message}`);
    }
  }
}

module.exports = SqlServerServicesRepository;
