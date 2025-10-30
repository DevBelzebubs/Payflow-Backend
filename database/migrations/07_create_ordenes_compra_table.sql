USE USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ordenes_compra')
BEGIN
    CREATE TABLE ordenes_compra (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        cliente_id UNIQUEIDENTIFIER NOT NULL,
        total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
        subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
        impuestos DECIMAL(10, 2) DEFAULT 0 CHECK (impuestos >= 0),
        estado NVARCHAR(50) NOT NULL DEFAULT 'pendiente',
        notas NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        CHECK (estado IN ('pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada'))
    );

    CREATE INDEX idx_ordenes_cliente_id ON ordenes_compra(cliente_id);
    CREATE INDEX idx_ordenes_estado ON ordenes_compra(estado);
END
GO
