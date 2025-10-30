/*
  # Create Users and Roles Schema

  ## New Tables
  
  ### `usuarios`
  - `id` (uuid, primary key) - Unique identifier
  - `email` (text, unique, not null) - User email
  - `password_hash` (text, not null) - Hashed password
  - `nombre` (text, not null) - User name
  - `telefono` (text) - Phone number
  - `activo` (boolean, default true) - Active status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `clientes`
  - `id` (uuid, primary key)
  - `usuario_id` (uuid, foreign key) - Reference to usuarios
  - `direccion` (text) - Address
  - `ciudad` (text) - City
  - `codigo_postal` (text) - Postal code
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `administradores`
  - `id` (uuid, primary key)
  - `usuario_id` (uuid, foreign key) - Reference to usuarios
  - `nivel_acceso` (text, not null) - Access level (super_admin, admin, moderator)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Add policies for admins to manage all data
*/

-- Create usuarios table
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  nombre text NOT NULL,
  telefono text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clientes table
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  direccion text,
  ciudad text,
  codigo_postal text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(usuario_id)
);

-- Create administradores table
CREATE TABLE IF NOT EXISTS administradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nivel_acceso text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(usuario_id),
  CHECK (nivel_acceso IN ('super_admin', 'admin', 'moderator'))
);

-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;

-- Policies for usuarios
CREATE POLICY "Users can view their own data"
  ON usuarios FOR SELECT
  TO authenticated
  USING (id = (current_setting('app.user_id', true))::uuid);

CREATE POLICY "Users can update their own data"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (id = (current_setting('app.user_id', true))::uuid)
  WITH CHECK (id = (current_setting('app.user_id', true))::uuid);

-- Policies for clientes
CREATE POLICY "Clients can view their own data"
  ON clientes FOR SELECT
  TO authenticated
  USING (usuario_id = (current_setting('app.user_id', true))::uuid);

CREATE POLICY "Clients can update their own data"
  ON clientes FOR UPDATE
  TO authenticated
  USING (usuario_id = (current_setting('app.user_id', true))::uuid)
  WITH CHECK (usuario_id = (current_setting('app.user_id', true))::uuid);

-- Policies for administradores
CREATE POLICY "Admins can view all admin data"
  ON administradores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_administradores_usuario_id ON administradores(usuario_id);