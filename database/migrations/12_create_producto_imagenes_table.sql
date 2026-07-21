USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'producto_imagenes')
BEGIN
    CREATE TABLE producto_imagenes (
        id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        producto_id UNIQUEIDENTIFIER NOT NULL,
        url_imagen  NVARCHAR(500) NOT NULL,
        orden       INT NOT NULL DEFAULT 0,

        CONSTRAINT FK_producto_imagenes_producto_id
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_producto_imagenes_producto_id ON producto_imagenes(producto_id);
END
GO
