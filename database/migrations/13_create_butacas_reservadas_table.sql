USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'butacas_reservadas')
BEGIN
    CREATE TABLE butacas_reservadas (
        id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        servicio_id UNIQUEIDENTIFIER NOT NULL,
        fila        NVARCHAR(10) NOT NULL,
        columna     INT NOT NULL,
        estado      NVARCHAR(50) DEFAULT 'reservada',
        usuario_id  UNIQUEIDENTIFIER NOT NULL,
        created_at  DATETIME2 DEFAULT GETDATE(),

        CONSTRAINT FK_butacas_reservadas_servicio_id
            FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
        CONSTRAINT FK_butacas_reservadas_usuario_id
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        CONSTRAINT UQ_butaca UNIQUE (servicio_id, fila, columna)
    );

    CREATE INDEX idx_butacas_servicio_id ON butacas_reservadas(servicio_id);
END
GO
