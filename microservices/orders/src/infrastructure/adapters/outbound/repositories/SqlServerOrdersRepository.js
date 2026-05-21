const OrdenCompraMapper = require('../../../mappers/OrdenCompraMapper');
const { getPool, sql } = require('../../../../../../../database/sqlServerConfig');
const IOrdersRepositoryPort = require('../../../../domain/ports/outbound/IOrdersRepositoryPort');

class SqlServerOrdersRepository extends IOrdersRepositoryPort {
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

          SELECT * FROM @OutputTbl;
        `);

      const data = result.recordset[0];
      return OrdenCompraMapper.toDomain(data);
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
      return OrdenCompraMapper.toDomain({ ...data, items: itemsResult.recordset });
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
        .query(`SELECT * FROM ordenes_compra WHERE cliente_id = @cliente_id AND estado != 'pendiente' ORDER BY created_at DESC`);

      const ordenes = [];
      for (const ordenData of ordenesResult.recordset) {
        const itemsResult = await pool
          .request()
          .input('orden_id', sql.UniqueIdentifier, ordenData.id)
          .query('SELECT * FROM items_orden WHERE orden_id = @orden_id');

        ordenes.push(OrdenCompraMapper.toDomain({ ...ordenData, items: itemsResult.recordset }));
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

        ordenes.push(OrdenCompraMapper.toDomain({ ...ordenData, items: itemsResult.recordset }));
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

  async createSuscripcion(data) {
    try {
      const pool = await getPool();
      const proximoPago = new Date();
      proximoPago.setMonth(proximoPago.getMonth() + 1);

      await pool.request()
        .input('cliente_id', sql.UniqueIdentifier, data.clienteId)
        .input('servicio_id', sql.UniqueIdentifier, data.servicioId)
        .input('precio', sql.Decimal(10, 2), data.precio)
        .input('cuenta_origen', sql.UniqueIdentifier, data.cuentaId || null)
        .input('prox_pago', sql.DateTime2, proximoPago)
        .query(`
          INSERT INTO suscripciones_cliente
          (cliente_id, servicio_id, precio_acordado, cuenta_origen_id, fecha_proximo_pago)
          VALUES (@cliente_id, @servicio_id, @precio, @cuenta_origen, @prox_pago)
        `);
      return true;
    } catch (error) {
      console.error("Error creando registro de suscripción:", error);
      return false;
    }
  }

  async findSuscripcionesParaRenovar() {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .query(`
          SELECT s.*, ser.nombre as nombre_servicio
          FROM suscripciones_cliente s
          INNER JOIN servicios ser ON s.servicio_id = ser.id
          WHERE s.estado = 'ACTIVA'
          AND s.fecha_proximo_pago <= GETDATE()
        `);
      return result.recordset;
    } catch (error) {
      throw new Error(`Error buscando renovaciones: ${error.message}`);
    }
  }

  async getSalesStats() {
    try {
      const pool = await getPool();

      const totalRevenue = await pool.request().query(`
        SELECT COALESCE(SUM(total), 0) as total FROM ordenes_compra
        WHERE estado IN ('CONFIRMADA', 'COMPLETADA')
      `);

      const avgOrder = await pool.request().query(`
        SELECT COALESCE(AVG(total), 0) as promedio FROM ordenes_compra
        WHERE estado IN ('CONFIRMADA', 'COMPLETADA')
      `);

      const ordersByStatus = await pool.request().query(`
        SELECT estado, COUNT(*) as cantidad FROM ordenes_compra
        GROUP BY estado
      `);

      const monthlyRevenue = await pool.request().query(`
        SELECT
          YEAR(created_at) as anio,
          MONTH(created_at) as mes,
          COALESCE(SUM(total), 0) as ingresos,
          COUNT(*) as ordenes
        FROM ordenes_compra
        WHERE estado IN ('CONFIRMADA', 'COMPLETADA')
          AND created_at >= DATEADD(MONTH, -11, GETDATE())
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY anio DESC, mes DESC
      `);

      const todayStats = await pool.request().query(`
        SELECT
          COUNT(*) as ordenes_hoy,
          COALESCE(SUM(total), 0) as ingresos_hoy
        FROM ordenes_compra
        WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
          AND estado IN ('CONFIRMADA', 'COMPLETADA')
      `);

      const totalOrders = await pool.request().query(`
        SELECT COUNT(*) as total FROM ordenes_compra
      `);

      const pendingCount = ordersByStatus.recordset.find(r => r.estado === 'pendiente');
      const confirmedCount = ordersByStatus.recordset.find(r => r.estado === 'CONFIRMADA');
      const completedCount = ordersByStatus.recordset.find(r => r.estado === 'COMPLETADA');
      const cancelledCount = ordersByStatus.recordset.find(r => r.estado === 'CANCELADO' || r.estado === 'CANCELADA');

      return {
        totalRevenue: totalRevenue.recordset[0].total,
        averageOrderValue: avgOrder.recordset[0].promedio,
        totalOrders: totalOrders.recordset[0].total,
        ordersByStatus: {
          pendientes: pendingCount ? pendingCount.cantidad : 0,
          confirmadas: confirmedCount ? confirmedCount.cantidad : 0,
          completadas: completedCount ? completedCount.cantidad : 0,
          canceladas: cancelledCount ? cancelledCount.cantidad : 0,
        },
        monthlyRevenue: monthlyRevenue.recordset.map(r => ({
          year: r.anio,
          month: r.mes,
          ingresos: r.ingresos,
          ordenes: r.ordenes,
        })),
        today: {
          orders: todayStats.recordset[0].ordenes_hoy,
          revenue: todayStats.recordset[0].ingresos_hoy,
        },
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas de ventas: ${error.message}`);
    }
  }

  async updateProximoPagoSuscripcion(suscripcionId) {
    try {
      const pool = await getPool();
      const nuevoPago = new Date();
      nuevoPago.setMonth(nuevoPago.getMonth() + 1);

      await pool.request()
        .input('id', sql.UniqueIdentifier, suscripcionId)
        .input('nuevo_pago', sql.DateTime2, nuevoPago)
        .query(`
          UPDATE suscripciones_cliente
          SET fecha_ultimo_pago = GETDATE(),
              fecha_proximo_pago = @nuevo_pago
          WHERE id = @id
        `);
    } catch (error) {
      throw new Error(`Error actualizando suscripción: ${error.message}`);
    }
  }
}

module.exports = SqlServerOrdersRepository;
