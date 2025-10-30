const Producto = require('../domain/Producto');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerProductsRepository {
  async createProducto(productoData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('nombre', sql.NVarChar, productoData.nombre)
        .input('descripcion', sql.NVarChar, productoData.descripcion)
        .input('precio', sql.Decimal(10, 2), productoData.precio)
        .input('stock', sql.Int, productoData.stock)
        .input('categoria', sql.NVarChar, productoData.categoria)
        .input('activo', sql.Bit, productoData.activo)
        .query(`
          INSERT INTO productos (nombre, descripcion, precio, stock, categoria, activo)
          OUTPUT INSERTED.*
          VALUES (@nombre, @descripcion, @precio, @stock, @categoria, @activo)
        `);

      const data = result.recordset[0];
      return new Producto(data);
    } catch (error) {
      throw new Error(`Error creando producto: ${error.message}`);
    }
  }

  async findProductoById(productoId) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.UniqueIdentifier, productoId)
        .query('SELECT * FROM productos WHERE id = @id');

      if (result.recordset.length === 0) {
        return null;
      }

      return new Producto(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error buscando producto: ${error.message}`);
    }
  }

  async findAllProductos(filters = {}) {
    try {
      const pool = await getPool();
      let query = 'SELECT * FROM productos WHERE 1=1';
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
      return result.recordset.map(item => new Producto(item));
    } catch (error) {
      throw new Error(`Error obteniendo productos: ${error.message}`);
    }
  }

  async updateProducto(productoId, productoData) {
    try {
      const pool = await getPool();

      const fields = [];
      const request = pool.request();
      request.input('id', sql.UniqueIdentifier, productoId);

      if (productoData.nombre !== undefined) {
        fields.push('nombre = @nombre');
        request.input('nombre', sql.NVarChar, productoData.nombre);
      }
      if (productoData.descripcion !== undefined) {
        fields.push('descripcion = @descripcion');
        request.input('descripcion', sql.NVarChar, productoData.descripcion);
      }
      if (productoData.precio !== undefined) {
        fields.push('precio = @precio');
        request.input('precio', sql.Decimal(10, 2), productoData.precio);
      }
      if (productoData.stock !== undefined) {
        fields.push('stock = @stock');
        request.input('stock', sql.Int, productoData.stock);
      }
      if (productoData.categoria !== undefined) {
        fields.push('categoria = @categoria');
        request.input('categoria', sql.NVarChar, productoData.categoria);
      }
      if (productoData.activo !== undefined) {
        fields.push('activo = @activo');
        request.input('activo', sql.Bit, productoData.activo);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      const result = await request.query(`
        UPDATE productos
        SET ${fields.join(', ')}, updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

      return new Producto(result.recordset[0]);
    } catch (error) {
      throw new Error(`Error actualizando producto: ${error.message}`);
    }
  }

  async deleteProducto(productoId) {
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id', sql.UniqueIdentifier, productoId)
        .query('DELETE FROM productos WHERE id = @id');

      return true;
    } catch (error) {
      throw new Error(`Error eliminando producto: ${error.message}`);
    }
  }
}

module.exports = SqlServerProductsRepository;
