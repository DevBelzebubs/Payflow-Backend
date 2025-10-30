USE payflow;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'administradores')
BEGIN
    CREATE TABLE administradores (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        usuario_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
        nivel_acceso NVARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        CHECK (nivel_acceso IN ('super_admin', 'admin', 'moderator'))
    );

    CREATE INDEX idx_administradores_usuario_id ON administradores(usuario_id);
END
GO
