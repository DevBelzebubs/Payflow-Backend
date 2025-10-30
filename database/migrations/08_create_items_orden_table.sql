USE microservices_db;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'items_orden')
BEGIN
    CREATE TABLE items_orden (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        orden_id UNIQUEIDENTIFIER NOT NULL,
        producto_id UNIQUEIDENTIFIER,
        servicio_id UNIQUEIDENTIFIER,
        cantidad INT NOT NULL CHECK (cantidad > 0),
        precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
        subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
        FOREIGN KEY (orden_id) REFERENCES ordenes_compra(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
        FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE SET NULL,
        CHECK (
            (producto_id IS NOT NULL AND servicio_id IS NULL) OR
            (producto_id IS NULL AND servicio_id IS NOT NULL)
        )
    );

    CREATE INDEX idx_items_orden_id ON items_orden(orden_id);
    CREATE INDEX idx_items_producto_id ON items_orden(producto_id);
    CREATE INDEX idx_items_servicio_id ON items_orden(servicio_id);
END
GO
