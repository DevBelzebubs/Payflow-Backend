USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reseñas')
BEGIN
    CREATE TABLE reseñas (
        id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        cliente_id    UNIQUEIDENTIFIER NOT NULL,
        producto_id   UNIQUEIDENTIFIER NOT NULL,
        calificacion  INT NOT NULL,
        titulo        NVARCHAR(255) NOT NULL,
        comentario    NVARCHAR(MAX) NOT NULL,
        created_at    DATETIME2 DEFAULT GETDATE(),

        CONSTRAINT FK_resenas_cliente_id
            FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        CONSTRAINT FK_resenas_producto_id
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
        CONSTRAINT CK_resenas_calificacion
            CHECK (calificacion >= 1 AND calificacion <= 5)
    );

    CREATE INDEX idx_resenas_cliente_id ON reseñas(cliente_id);
    CREATE INDEX idx_resenas_producto_id ON reseñas(producto_id);
END
GO
