const OrdenCompra = require('../domain/OrdenCompra');
const { getPool, sql } = require('../../../../database/sqlServerConfig');

class SqlServerOrdersRepository {
  async createOrden(ordenData) {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('cliente_id', sql.UniqueIdentifier, ordenData.cliente_id)
        .input('total', sql.Decimal(10, 2), ordenData.total)
        .input('subtotal', sql.Decimal(10, 2), ordenData.subtotal)
        .input('impuestos', sql.Decimal(10, 2), ordenData.impuestos)
        .input('estado', sql.NVarChar, ordenData.estado)
        .input('notas', sql.NVarChar, ordenData.notas)
        .query(`
          -- 1. Declaramos una tabla variable para capturar la salida
          DECLARE @OutputTbl TABLE (
            id UNIQUEIDENTIFIER,
            cliente_id UNIQUEIDENTIFIER,
            total DECIMAL(10, 2),
            subtotal DECIMAL(10, 2),
            impuestos DECIMAL(10, 2),
            estado NVARCHAR(50),
            notas NVARCHAR(MAX),
            created_at DATETIME2,
            updated_at DATETIME2
          );

          -- 2. Insertamos usando OUTPUT INTO hacia la tabla variable
          -- Esto es compatible con tu trigger 'trg_ordenes_compra_historial'
          INSERT INTO ordenes_compra (cliente_id, total, subtotal, impuestos, estado, notas)
          OUTPUT 
            INSERTED.id, 
            INSERTED.cliente_id, 
            INSERTED.total, 
            INSERTED.subtotal, 
            INSERTED.impuestos, 
            INSERTED.estado, 
            INSERTED.notas, 
            INSERTED.created_at, 
            INSERTED.updated_at 
          INTO @OutputTbl
          VALUES (@cliente_id, @total, @subtotal, @impuestos, @estado, @notas);

          -- 3. Devolvemos los datos desde la tabla variable
          SELECT * FROM @OutputTbl;
        `);

      const data = result.recordset[0];
      return new OrdenCompra({
        id: data.id,
        clienteId: data.cliente_id,
        total: data.total,
        subtotal: data.subtotal,
        impuestos: data.impuestos,
        estado: data.estado,
        notas: data.notas,
        createdAt: data.created_at
      });
    } catch (error) {
      throw new Error(`Error creando orden: ${error.message}`);
    }
  }

  async createItemOrden(itemData) {
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('orden_id', sql.UniqueIdentifier, itemData.orden_id)
        .input('producto_id', sql.UniqueIdentifier, itemData.producto_id)
        .input('servicio_id', sql.UniqueIdentifier, itemData.servicio_id)
        .input('cantidad', sql.Int, itemData.cantidad)
        .input('precio_unitario', sql.Decimal(10, 2), itemData.precio_unitario)
        .input('subtotal', sql.Decimal(10, 2), itemData.subtotal)
        .query(`
          INSERT INTO items_orden (orden_id, producto_id, servicio_id, cantidad, precio_unitario, subtotal)
          VALUES (@orden_id, @producto_id, @servicio_id, @cantidad, @precio_unitario, @subtotal)
        `);

      return true;
    } catch (error) {
      throw new Error(`Error creando item de orden: ${error.message}`);
    }
  }

  async findOrdenById(ordenId) {
    try {
      const pool = await getPool();
      const ordenResult = await pool
        .request()
        .input('id', sql.UniqueIdentifier, ordenId)
        .query('SELECT * FROM ordenes_compra WHERE id = @id');

      if (ordenResult.recordset.length === 0) {
        return null;
      }

      const itemsResult = await pool
        .request()
        .input('orden_id', sql.UniqueIdentifier, ordenId)
        .query('SELECT * FROM items_orden WHERE orden_id = @orden_id');

      const data = ordenResult.recordset[0];
      return new OrdenCompra({
        id: data.id,
        clienteId: data.cliente_id,
        total: data.total,
        subtotal: data.subtotal,
        impuestos: data.impuestos,
        estado: data.estado,
        notas: data.notas,
        createdAt: data.created_at,
        items: itemsResult.recordset
      });
    } catch (error) {
      throw new Error(`Error buscando orden: ${error.message}`);
    }
  }

  async findOrdenesByCliente(clienteId) {
    try {
      const pool = await getPool();
      const ordenesResult = await pool
        .request()
        .input('cliente_id', sql.UniqueIdentifier, clienteId)
        .query('SELECT * FROM ordenes_compra WHERE cliente_id = @cliente_id ORDER BY created_at DESC');

      const ordenes = [];
      for (const ordenData of ordenesResult.recordset) {
        const itemsResult = await pool
          .request()
          .input('orden_id', sql.UniqueIdentifier, ordenData.id)
          .query('SELECT * FROM items_orden WHERE orden_id = @orden_id');

        ordenes.push(new OrdenCompra({
          id: ordenData.id,
          clienteId: ordenData.cliente_id,
          total: ordenData.total,
          subtotal: ordenData.subtotal,
          impuestos: ordenData.impuestos,
          estado: ordenData.estado,
          notas: ordenData.notas,
          createdAt: ordenData.created_at,
          items: itemsResult.recordset
        }));
      }

      return ordenes;
    } catch (error) {
      throw new Error(`Error buscando ordenes: ${error.message}`);
    }
  }

  async findAllOrdenes() {
    try {
      const pool = await getPool();
      const ordenesResult = await pool
        .request()
        .query('SELECT * FROM ordenes_compra ORDER BY created_at DESC');

      const ordenes = [];
      for (const ordenData of ordenesResult.recordset) {
        const itemsResult = await pool
          .request()
          .input('orden_id', sql.UniqueIdentifier, ordenData.id)
          .query('SELECT * FROM items_orden WHERE orden_id = @orden_id');

        ordenes.push(new OrdenCompra({
          id: ordenData.id,
          clienteId: ordenData.cliente_id,
          total: ordenData.total,
          subtotal: ordenData.subtotal,
          impuestos: ordenData.impuestos,
          estado: ordenData.estado,
          notas: ordenData.notas,
          createdAt: ordenData.created_at,
          items: itemsResult.recordset
        }));
      }

      return ordenes;
    } catch (error) {
      throw new Error(`Error obteniendo ordenes: ${error.message}`);
    }
  }

  async updateOrden(ordenId, ordenData) {
    try {
      const pool = await getPool();

      const fields = [];
      const request = pool.request();
      request.input('id', sql.UniqueIdentifier, ordenId);

      if (ordenData.estado !== undefined) {
        fields.push('estado = @estado');
        request.input('estado', sql.NVarChar, ordenData.estado);
      }
      if (ordenData.notas !== undefined) {
        fields.push('notas = @notas');
        request.input('notas', sql.NVarChar, ordenData.notas);
      }

      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      await request.query(`
        UPDATE ordenes_compra
        SET ${fields.join(', ')}, updated_at = GETDATE()
        WHERE id = @id
      `);

      return await this.findOrdenById(ordenId);
    } catch (error) {
      throw new Error(`Error actualizando orden: ${error.message}`);
    }
  }
  async reservarButacas(servicioId, listaButacas, usuarioId) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      for (const butaca of listaButacas) {
        const request = new sql.Request(transaction);
        await request
          .input('servicio_id', sql.UniqueIdentifier, servicioId)
          .input('fila', sql.NVarChar, butaca.row)
          .input('columna', sql.Int, butaca.col)
          .input('usuario_id', sql.UniqueIdentifier, usuarioId)
          .query(`
             INSERT INTO butacas_reservadas (servicio_id, fila, columna, usuario_id)
             VALUES (@servicio_id, @fila, @columna, @usuario_id)
          `);
      }

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      if (error.number === 2601 || error.number === 2627) {
         throw new Error("Una o más butacas seleccionadas ya han sido ocupadas.");
      }
      throw error;
    }
  }
}

module.exports = SqlServerOrdersRepository;
