-- Add missing columns to usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dni text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol text DEFAULT 'cliente';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS banner_url text;

-- Add missing columns to productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url text;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS marca text;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS especificaciones jsonb;

-- Add missing columns to servicios
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS imagen_url text;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activo';
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS tipo_servicio text;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS sinopsis text;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS fecha_evento timestamptz;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS proveedor text;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS rating numeric(3, 2);
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS info_adicional_json jsonb;

-- Add missing column to cuentas_bancarias
ALTER TABLE cuentas_bancarias ADD COLUMN IF NOT EXISTS saldo numeric(10, 2) DEFAULT 0;
