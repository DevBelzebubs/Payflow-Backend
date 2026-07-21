ALTER TABLE servicios ADD COLUMN cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL;

CREATE INDEX idx_servicios_cliente_id ON servicios(cliente_id);

ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "servicios_select_client_owner" ON servicios
    FOR SELECT USING (
        cliente_id IS NULL OR
        cliente_id IN (SELECT id FROM clientes WHERE usuario_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "servicios_update_client_owner" ON servicios
    FOR UPDATE USING (
        cliente_id IN (SELECT id FROM clientes WHERE usuario_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );
