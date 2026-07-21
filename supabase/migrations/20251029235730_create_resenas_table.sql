CREATE TABLE IF NOT EXISTS reseñas (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id    uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    producto_id   uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    calificacion  integer NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    titulo        text NOT NULL,
    comentario    text NOT NULL,
    created_at    timestamptz DEFAULT now()
);

ALTER TABLE reseñas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resenas_select_public" ON reseñas
    FOR SELECT USING (true);

CREATE POLICY "resenas_insert_auth" ON reseñas
    FOR INSERT WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "resenas_update_own" ON reseñas
    FOR UPDATE USING (auth.uid() = cliente_id);

CREATE POLICY "resenas_delete_own" ON reseñas
    FOR DELETE USING (auth.uid() = cliente_id);
