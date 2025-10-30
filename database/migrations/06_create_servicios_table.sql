USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'servicios')
BEGIN
    CREATE TABLE servicios (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        nombre NVARCHAR(255) NOT NULL,
        descripcion NVARCHAR(MAX),
        precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
        duracion_estimada INT,
        categoria NVARCHAR(100),
        activo BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX idx_servicios_categoria ON servicios(categoria);
    CREATE INDEX idx_servicios_activo ON servicios(activo);
END
GO
