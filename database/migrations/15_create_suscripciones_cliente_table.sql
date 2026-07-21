USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'suscripciones_cliente')
BEGIN
    CREATE TABLE suscripciones_cliente (
        id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        cliente_id         UNIQUEIDENTIFIER NOT NULL,
        servicio_id        UNIQUEIDENTIFIER NOT NULL,
        fecha_inicio       DATETIME2 DEFAULT GETDATE(),
        fecha_ultimo_pago  DATETIME2,
        fecha_proximo_pago DATETIME2 NOT NULL,
        precio_acordado    DECIMAL(10, 2) NOT NULL CHECK (precio_acordado >= 0),
        estado             NVARCHAR(50) NOT NULL DEFAULT 'ACTIVA',
        cuenta_origen_id   UNIQUEIDENTIFIER,

        CONSTRAINT FK_suscripciones_cliente_id
            FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        CONSTRAINT FK_suscripciones_servicio_id
            FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
        CONSTRAINT FK_suscripciones_cuenta_origen_id
            FOREIGN KEY (cuenta_origen_id) REFERENCES cuentas_bancarias(id) ON DELETE SET NULL,
        CONSTRAINT CK_suscripciones_estado CHECK (estado IN ('ACTIVA', 'PAUSADA', 'CANCELADA'))
    );

    CREATE INDEX idx_suscripciones_cliente_id ON suscripciones_cliente(cliente_id);
    CREATE INDEX idx_suscripciones_estado_fecha ON suscripciones_cliente(estado, fecha_proximo_pago);
END
GO
