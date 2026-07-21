USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tipos_entrada')
BEGIN
    CREATE TABLE tipos_entrada (
        id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        servicio_id   UNIQUEIDENTIFIER NOT NULL,
        nombre        NVARCHAR(255) NOT NULL,
        precio        DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
        stock_total   INT NOT NULL DEFAULT 0 CHECK (stock_total >= 0),
        stock_vendido INT NOT NULL DEFAULT 0 CHECK (stock_vendido >= 0),
        created_at    DATETIME2 DEFAULT GETDATE(),

        CONSTRAINT FK_tipos_entrada_servicio_id
            FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_tipos_entrada_servicio_id ON tipos_entrada(servicio_id);
END
GO
