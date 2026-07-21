CREATE TABLE IF NOT EXISTS historial_ordenes (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id           uuid NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    cliente_id         uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    estado_anterior    text,
    estado_nuevo       text,
    total_orden        numeric(10, 2),
    notas_orden        text,
    fecha_modificacion timestamptz DEFAULT now()
);

ALTER TABLE historial_ordenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historial_ordenes_select_own" ON historial_ordenes
    FOR SELECT USING (
        cliente_id IN (SELECT id FROM clientes WHERE usuario_id = auth.uid())
    );

CREATE POLICY "historial_ordenes_select_admin" ON historial_ordenes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "historial_ordenes_insert_admin" ON historial_ordenes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );
