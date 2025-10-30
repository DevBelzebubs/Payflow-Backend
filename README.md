# Backend con Microservicios - Arquitectura Hexagonal

Sistema backend desarrollado con Express.js, implementando arquitectura hexagonal y microservicios que se comunican mediante REST API. Incluye autenticación JWT y base de datos SQL Server.

## Arquitectura

El sistema está compuesto por 6 microservicios independientes y un API Gateway:

### Microservicios

1. **Auth Service** (Puerto 3001)
   - Registro de usuarios
   - Login con JWT
   - Verificación de tokens

2. **Users Service** (Puerto 3002)
   - Gestión de clientes
   - Gestión de administradores

3. **Products Service** (Puerto 3003)
   - CRUD de productos
   - Gestión de inventario/stock

4. **Services Service** (Puerto 3004)
   - CRUD de servicios

5. **Orders Service** (Puerto 3005)
   - Creación de órdenes de compra
   - Gestión de estados de órdenes
   - Integración con productos y servicios

6. **Bank Accounts Service** (Puerto 3006)
   - Gestión de cuentas bancarias
   - Enmascaramiento de números de cuenta

### API Gateway (Puerto 3000)

El API Gateway actúa como punto único de entrada para todas las peticiones y las redirige a los microservicios correspondientes.

## Base de Datos

El sistema utiliza SQL Server con las siguientes tablas:

- `usuarios` - Información base de usuarios
- `clientes` - Perfil de clientes
- `administradores` - Perfil de administradores
- `productos` - Catálogo de productos
- `servicios` - Catálogo de servicios
- `ordenes_compra` - Órdenes de compra
- `items_orden` - Items de cada orden
- `cuentas_bancarias` - Cuentas bancarias de clientes

## Estructura del Proyecto

```
project/
├── microservices/
│   ├── auth/
│   │   ├── src/
│   │   │   ├── domain/          # Entidades y lógica de negocio
│   │   │   ├── application/     # Casos de uso
│   │   │   └── infrastructure/  # Implementaciones (BD, API, etc)
│   │   └── index.js
│   ├── users/
│   ├── products/
│   ├── services/
│   ├── orders/
│   └── bank-accounts/
├── api-gateway/
│   └── index.js
├── .env
└── package.json
```

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar SQL Server:
   - Instalar SQL Server o usar SQL Server Express
   - Crear la base de datos ejecutando los scripts en `database/migrations/` en orden

4. Configurar variables de entorno en `.env`:
```env
# SQL Server Configuration
DB_USER=sa
DB_PASSWORD=YourStrongPassword123
DB_SERVER=localhost
DB_DATABASE=microservices_db
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Microservices Ports
AUTH_PORT=3001
USERS_PORT=3002
PRODUCTS_PORT=3003
SERVICES_PORT=3004
ORDERS_PORT=3005
BANK_ACCOUNTS_PORT=3006
API_GATEWAY_PORT=3000
```

## Ejecución

### Opción 1: Ejecutar cada microservicio por separado

```bash
# Terminal 1 - Auth Service
npm run start:auth

# Terminal 2 - Users Service
npm run start:users

# Terminal 3 - Products Service
npm run start:products

# Terminal 4 - Services Service
npm run start:services

# Terminal 5 - Orders Service
npm run start:orders

# Terminal 6 - Bank Accounts Service
npm run start:bank-accounts

# Terminal 7 - API Gateway
npm run start:gateway
```

### Opción 2: Usar el API Gateway como punto único

Ejecuta todos los microservicios necesarios y luego:

```bash
npm run start:gateway
```

El API Gateway estará disponible en `http://localhost:3000`

## Endpoints API Gateway

### Autenticación

```
POST /api/auth/register
POST /api/auth/login
GET /api/auth/verify
```

### Clientes

```
POST /api/clientes
GET /api/clientes/:usuarioId
GET /api/clientes
```

### Administradores

```
POST /api/administradores
```

### Productos

```
GET /api/productos
GET /api/productos/:productoId
POST /api/productos (requiere auth)
PUT /api/productos/:productoId (requiere auth)
DELETE /api/productos/:productoId (requiere auth)
```

### Servicios

```
GET /api/servicios
GET /api/servicios/:servicioId
POST /api/servicios (requiere auth)
PUT /api/servicios/:servicioId (requiere auth)
DELETE /api/servicios/:servicioId (requiere auth)
```

### Órdenes de Compra

```
POST /api/ordenes (requiere auth)
GET /api/ordenes/:ordenId (requiere auth)
GET /api/ordenes/cliente/:clienteId (requiere auth)
GET /api/ordenes (requiere auth)
PATCH /api/ordenes/:ordenId/estado (requiere auth)
POST /api/ordenes/:ordenId/cancelar (requiere auth)
```

### Cuentas Bancarias

```
POST /api/cuentas-bancarias (requiere auth)
GET /api/cuentas-bancarias/cliente/:clienteId (requiere auth)
GET /api/cuentas-bancarias/:cuentaId (requiere auth)
PUT /api/cuentas-bancarias/:cuentaId (requiere auth)
DELETE /api/cuentas-bancarias/:cuentaId (requiere auth)
```

## Autenticación

El sistema utiliza JWT (JSON Web Tokens). Para acceder a endpoints protegidos:

1. Registrarse o iniciar sesión
2. Incluir el token en el header: `Authorization: Bearer <token>`

## Ejemplo de Uso

### 1. Registrar usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "password123",
    "nombre": "Juan Pérez",
    "telefono": "555-1234"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "password123"
  }'
```

### 3. Crear orden de compra

```bash
curl -X POST http://localhost:3000/api/ordenes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "clienteId": "uuid-del-cliente",
    "items": [
      {
        "productoId": "uuid-del-producto",
        "cantidad": 2
      }
    ],
    "notas": "Entrega urgente"
  }'
```

## Tecnologías

- **Express.js** - Framework web
- **SQL Server** - Base de datos relacional
- **mssql** - Driver de Node.js para SQL Server
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas
- **Axios** - Comunicación entre microservicios
- **Arquitectura Hexagonal** - Separación de capas (Domain, Application, Infrastructure)

## Migraciones de Base de Datos

Los scripts de migración están en `database/migrations/`. Ejecutarlos en orden:

1. `01_create_database.sql` - Crea la base de datos
2. `02_create_usuarios_table.sql` - Tabla de usuarios
3. `03_create_clientes_table.sql` - Tabla de clientes
4. `04_create_administradores_table.sql` - Tabla de administradores
5. `05_create_productos_table.sql` - Tabla de productos
6. `06_create_servicios_table.sql` - Tabla de servicios
7. `07_create_ordenes_compra_table.sql` - Tabla de órdenes
8. `08_create_items_orden_table.sql` - Tabla de items de orden
9. `09_create_cuentas_bancarias_table.sql` - Tabla de cuentas bancarias

Puedes ejecutarlos usando SQL Server Management Studio o con el comando:
```bash
sqlcmd -S localhost -U sa -P YourPassword -i database/migrations/01_create_database.sql
```
