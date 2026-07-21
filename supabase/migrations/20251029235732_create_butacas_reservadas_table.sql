CREATE TABLE IF NOT EXISTS butacas_reservadas (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id uuid NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    fila        text NOT NULL,
    columna     integer NOT NULL,
    estado      text DEFAULT 'reservada',
    usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at  timestamptz DEFAULT now(),

    CONSTRAINT UQ_butaca UNIQUE (servicio_id, fila, columna)
);

ALTER TABLE butacas_reservadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "butacas_select_admin" ON butacas_reservadas
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "butacas_select_own" ON butacas_reservadas
    FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "butacas_insert_authenticated" ON butacas_reservadas
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND usuario_id = auth.uid()
    );

CREATE POLICY "butacas_delete_own" ON butacas_reservadas
    FOR DELETE USING (usuario_id = auth.uid());
