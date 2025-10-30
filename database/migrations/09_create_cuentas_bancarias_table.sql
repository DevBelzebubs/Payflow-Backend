USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cuentas_bancarias')
BEGIN
    CREATE TABLE cuentas_bancarias (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        cliente_id UNIQUEIDENTIFIER NOT NULL,
        banco NVARCHAR(100) NOT NULL,
        numero_cuenta NVARCHAR(100) NOT NULL,
        tipo_cuenta NVARCHAR(50) NOT NULL DEFAULT 'ahorro',
        titular NVARCHAR(255) NOT NULL,
        activo BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        CHECK (tipo_cuenta IN ('ahorro', 'corriente', 'nomina'))
    );

    CREATE INDEX idx_cuentas_cliente_id ON cuentas_bancarias(cliente_id);
END
GO
