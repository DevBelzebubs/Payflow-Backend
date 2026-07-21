CREATE TABLE IF NOT EXISTS suscripciones_cliente (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id         uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    servicio_id        uuid NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    fecha_inicio       timestamptz DEFAULT now(),
    fecha_ultimo_pago  timestamptz,
    fecha_proximo_pago timestamptz NOT NULL,
    precio_acordado    numeric(10, 2) NOT NULL CHECK (precio_acordado >= 0),
    estado             text NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'PAUSADA', 'CANCELADA')),
    cuenta_origen_id   uuid REFERENCES cuentas_bancarias(id) ON DELETE SET NULL
);

ALTER TABLE suscripciones_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suscripciones_select_own" ON suscripciones_cliente
    FOR SELECT USING (
        cliente_id IN (SELECT id FROM clientes WHERE usuario_id = auth.uid())
    );

CREATE POLICY "suscripciones_select_admin" ON suscripciones_cliente
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "suscripciones_insert_admin" ON suscripciones_cliente
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "suscripciones_update_admin" ON suscripciones_cliente
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );

CREATE POLICY "suscripciones_delete_admin" ON suscripciones_cliente
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM administradores WHERE usuario_id = auth.uid())
    );
