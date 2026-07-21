CREATE TABLE IF NOT EXISTS tipos_entrada (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id   uuid NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    nombre        text NOT NULL,
    precio        numeric(10, 2) NOT NULL CHECK (precio >= 0),
    stock_total   integer NOT NULL DEFAULT 0 CHECK (stock_total >= 0),
    stock_vendido integer NOT NULL DEFAULT 0 CHECK (stock_vendido >= 0),
    created_at    timestamptz DEFAULT now()
);

ALTER TABLE tipos_entrada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tipos_entrada_select_public" ON tipos_entrada
    FOR SELECT USING (true);

CREATE POLICY "tipos_entrada_insert_admin" ON tipos_entrada
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "tipos_entrada_update_admin" ON tipos_entrada
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "tipos_entrada_delete_admin" ON tipos_entrada
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );
