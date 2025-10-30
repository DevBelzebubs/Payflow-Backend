/*
  # Create Products and Services Schema

  ## New Tables
  
  ### `productos`
  - `id` (uuid, primary key) - Unique identifier
  - `nombre` (text, not null) - Product name
  - `descripcion` (text) - Product description
  - `precio` (numeric, not null) - Product price
  - `stock` (integer, default 0) - Available stock
  - `categoria` (text) - Product category
  - `activo` (boolean, default true) - Active status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `servicios`
  - `id` (uuid, primary key) - Unique identifier
  - `nombre` (text, not null) - Service name
  - `descripcion` (text) - Service description
  - `precio` (numeric, not null) - Service price
  - `duracion_estimada` (integer) - Estimated duration in minutes
  - `categoria` (text) - Service category
  - `activo` (boolean, default true) - Active status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Public read access for active products/services
  - Admin-only write access
*/

-- Create productos table
CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  precio numeric(10, 2) NOT NULL CHECK (precio >= 0),
  stock integer DEFAULT 0 CHECK (stock >= 0),
  categoria text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create servicios table
CREATE TABLE IF NOT EXISTS servicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  precio numeric(10, 2) NOT NULL CHECK (precio >= 0),
  duracion_estimada integer,
  categoria text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

-- Policies for productos (public read for active products)
CREATE POLICY "Anyone can view active products"
  ON productos FOR SELECT
  USING (activo = true);

CREATE POLICY "Admins can manage products"
  ON productos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- Policies for servicios (public read for active services)
CREATE POLICY "Anyone can view active services"
  ON servicios FOR SELECT
  USING (activo = true);

CREATE POLICY "Admins can manage services"
  ON servicios FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON servicios(categoria);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicios(activo);