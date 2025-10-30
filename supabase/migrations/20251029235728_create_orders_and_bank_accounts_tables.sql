/*
  # Create Orders and Bank Accounts Schema

  ## New Tables
  
  ### `ordenes_compra`
  - `id` (uuid, primary key) - Unique identifier
  - `cliente_id` (uuid, foreign key) - Reference to clientes
  - `total` (numeric, not null) - Total amount
  - `subtotal` (numeric, not null) - Subtotal amount
  - `impuestos` (numeric, default 0) - Taxes
  - `estado` (text, not null) - Order status
  - `notas` (text) - Order notes
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `items_orden`
  - `id` (uuid, primary key) - Unique identifier
  - `orden_id` (uuid, foreign key) - Reference to ordenes_compra
  - `producto_id` (uuid, nullable) - Reference to productos
  - `servicio_id` (uuid, nullable) - Reference to servicios
  - `cantidad` (integer, not null) - Quantity
  - `precio_unitario` (numeric, not null) - Unit price
  - `subtotal` (numeric, not null) - Line subtotal

  ### `cuentas_bancarias`
  - `id` (uuid, primary key) - Unique identifier
  - `cliente_id` (uuid, foreign key) - Reference to clientes
  - `banco` (text, not null) - Bank name
  - `numero_cuenta` (text, not null) - Account number (encrypted)
  - `tipo_cuenta` (text, not null) - Account type
  - `titular` (text, not null) - Account holder name
  - `activo` (boolean, default true) - Active status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Clients can view/manage their own orders and bank accounts
  - Admins can view all orders
*/

-- Create ordenes_compra table
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  total numeric(10, 2) NOT NULL CHECK (total >= 0),
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  impuestos numeric(10, 2) DEFAULT 0 CHECK (impuestos >= 0),
  estado text NOT NULL DEFAULT 'pendiente',
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (estado IN ('pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada'))
);

-- Create items_orden table
CREATE TABLE IF NOT EXISTS items_orden (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id uuid NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  servicio_id uuid REFERENCES servicios(id) ON DELETE SET NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10, 2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  CHECK (
    (producto_id IS NOT NULL AND servicio_id IS NULL) OR
    (producto_id IS NULL AND servicio_id IS NOT NULL)
  )
);

-- Create cuentas_bancarias table
CREATE TABLE IF NOT EXISTS cuentas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  banco text NOT NULL,
  numero_cuenta text NOT NULL,
  tipo_cuenta text NOT NULL DEFAULT 'ahorro',
  titular text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (tipo_cuenta IN ('ahorro', 'corriente', 'nomina'))
);

-- Enable RLS
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_bancarias ENABLE ROW LEVEL SECURITY;

-- Policies for ordenes_compra
CREATE POLICY "Clients can view their own orders"
  ON ordenes_compra FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

CREATE POLICY "Clients can create orders"
  ON ordenes_compra FOR INSERT
  TO authenticated
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

CREATE POLICY "Admins can view all orders"
  ON ordenes_compra FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- Policies for items_orden
CREATE POLICY "Users can view items from their orders"
  ON items_orden FOR SELECT
  TO authenticated
  USING (
    orden_id IN (
      SELECT o.id FROM ordenes_compra o
      INNER JOIN clientes c ON o.cliente_id = c.id
      WHERE c.usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

CREATE POLICY "Admins can view all order items"
  ON items_orden FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM administradores
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- Policies for cuentas_bancarias
CREATE POLICY "Clients can view their own bank accounts"
  ON cuentas_bancarias FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

CREATE POLICY "Clients can manage their own bank accounts"
  ON cuentas_bancarias FOR ALL
  TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  )
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes
      WHERE usuario_id = (current_setting('app.user_id', true))::uuid
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente_id ON ordenes_compra(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_items_orden_id ON items_orden(orden_id);
CREATE INDEX IF NOT EXISTS idx_items_producto_id ON items_orden(producto_id);
CREATE INDEX IF NOT EXISTS idx_items_servicio_id ON items_orden(servicio_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_cliente_id ON cuentas_bancarias(cliente_id);