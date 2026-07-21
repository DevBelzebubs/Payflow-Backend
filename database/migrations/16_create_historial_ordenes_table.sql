USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'historial_ordenes')
BEGIN
    CREATE TABLE historial_ordenes (
        id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        orden_id           UNIQUEIDENTIFIER NOT NULL,
        cliente_id         UNIQUEIDENTIFIER NOT NULL,
        estado_anterior    NVARCHAR(50),
        estado_nuevo       NVARCHAR(50),
        total_orden        DECIMAL(10, 2),
        notas_orden        NVARCHAR(MAX),
        fecha_modificacion DATETIME2 DEFAULT GETDATE(),

        CONSTRAINT FK_historial_ordenes_orden_id
            FOREIGN KEY (orden_id) REFERENCES ordenes_compra(id) ON DELETE CASCADE,
        CONSTRAINT FK_historial_ordenes_cliente_id
            FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_historial_orden_id ON historial_ordenes(orden_id);
END
GO
