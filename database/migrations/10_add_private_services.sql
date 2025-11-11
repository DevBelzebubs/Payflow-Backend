USE payflow;
GO

ALTER TABLE [dbo].[servicios]
ADD cliente_id UNIQUEIDENTIFIER NULL;
GO

ALTER TABLE [dbo].[servicios]
ADD CONSTRAINT FK_servicios_cliente_id
FOREIGN KEY (cliente_id) REFERENCES clientes(id)
ON DELETE SET NULL;
GO

CREATE INDEX idx_servicios_cliente_id ON [dbo].[servicios](cliente_id);
GO