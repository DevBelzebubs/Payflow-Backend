CREATE TABLE IF NOT EXISTS producto_imagenes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    url_imagen  text NOT NULL,
    orden       integer NOT NULL DEFAULT 0
);

ALTER TABLE producto_imagenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "producto_imagenes_select_public" ON producto_imagenes
    FOR SELECT USING (true);

CREATE POLICY "producto_imagenes_insert_admin" ON producto_imagenes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "producto_imagenes_update_admin" ON producto_imagenes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "producto_imagenes_delete_admin" ON producto_imagenes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );
