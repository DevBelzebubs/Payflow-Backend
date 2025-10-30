USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'productos')
BEGIN
    CREATE TABLE productos (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        nombre NVARCHAR(255) NOT NULL,
        descripcion NVARCHAR(MAX),
        precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
        stock INT DEFAULT 0 CHECK (stock >= 0),
        categoria NVARCHAR(100),
        activo BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX idx_productos_categoria ON productos(categoria);
    CREATE INDEX idx_productos_activo ON productos(activo);
END
GO
