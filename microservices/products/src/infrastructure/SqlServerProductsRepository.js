const Producto = require('../domain/Producto');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerProductsRepository {
  async createProducto(productoData) {
    try {
      const pool = await getPool();
      const hasImage = productoData.imagen_url !== undefined;
      const hasMarca = productoData.marca !== undefined;
      const hasSpecs = productoData.especificaciones !== undefined;

      let cols = 'nombre, descripcion, precio, stock, categoria, activo';
      let vals = '@nombre, @descripcion, @precio, @stock, @categoria, @activo';
      
      if (hasImage) { cols += ', imagen_url'; vals += ', @imagen_url'; }
      if (hasMarca) { cols += ', marca'; vals += ', @marca'; }
      if (hasSpecs) { cols += ', especificaciones'; vals += ', @especificaciones'; }

      let query = `
        INSERT INTO productos (${cols})
        OUTPUT INSERTED.*
        VALUES (${vals})
      `;

      const request = pool.request()
        .input('nombre', sql.NVarChar, productoData.nombre)
        .input('descripcion', sql.NVarChar, productoData.descripcion)
        .input('precio', sql.Decimal(10, 2), productoData.precio)
        .input('stock', sql.Int, productoData.stock)
        .input('categoria', sql.NVarChar, productoData.categoria)
        .input('activo', sql.Bit, productoData.activo);

      if (hasImage) {
        request.input('imagen_url', sql.NVarChar, productoData.imagen_url);
      }
      if (hasMarca) {
        request.input('marca', sql.NVarChar, productoData.marca);
      }
      if (hasSpecs) {
        request.input('especificaciones', sql.NVarChar, JSON.stringify(productoData.especificaciones));
      }
      
      const result = await request.query(query);

      return new Producto(result.recordset[0]); 
    } catch (error) {
      throw new Error(`Error creando producto: ${error.message}`);
    }
  }

  async findProductoById(productoId) {
    try {
      const pool = await getPool();
      
      const query = `
        SELECT
          p.*,
          (
            SELECT pi.id, pi.url_imagen, pi.orden
            FROM producto_imagenes pi
            WHERE pi.producto_id = p.id
            ORDER BY pi.orden ASC
            FOR JSON PATH
          ) AS imagenes,
          (
            SELECT 
              r.id, r.calificacion, r.titulo, r.comentario, r.created_at,
              u.nombre AS nombre_cliente
            FROM reseñas r
            JOIN clientes c ON r.cliente_id = c.id
            JOIN usuarios u ON c.usuario_id = u.id -- Obtenemos el nombre del usuario
            WHERE r.producto_id = p.id
            ORDER BY r.created_at DESC
            FOR JSON PATH
          ) AS reseñas
        FROM productos p
        WHERE p.id = @id;
      `;
      
      const result = await pool
        .request()
        .input('id', sql.UniqueIdentifier, productoId)
        .query(query);

      if (result.recordset.length === 0) {
        return null;
      }

      const data = result.recordset[0];

      const productoData = {
        ...data,
        especificaciones: data.especificaciones ? JSON.parse(data.especificaciones) : {},
        imagenes: data.imagenes ? JSON.parse(data.imagenes) : [],
        reseñas: data.reseñas ? JSON.parse(data.reseñas) : []
      };

      return new Producto(productoData);
    } catch (error) {
      console.error(`Error SQL en findProductoById: ${error.message}`);
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

      const props = ['nombre', 'descripcion', 'precio', 'stock', 'categoria', 'activo', 'imagen_url', 'marca'];
      props.forEach(prop => {
        if (productoData[prop] !== undefined) {
          fields.push(`${prop} = @${prop}`);
          let type = sql.NVarChar;
          if (prop === 'precio') type = sql.Decimal(10, 2);
          if (prop === 'stock') type = sql.Int;
          if (prop === 'activo') type = sql.Bit;
          request.input(prop, type, productoData[prop]);
        }
      });
      
      if (productoData.especificaciones !== undefined) {
        fields.push('especificaciones = @especificaciones');
        request.input('especificaciones', sql.NVarChar, JSON.stringify(productoData.especificaciones));
      }

      if (fields.length === 0) {
        return await this.findProductoById(productoId);
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