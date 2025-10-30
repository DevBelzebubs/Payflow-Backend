# Backend con Microservicios - Arquitectura Hexagonal

Sistema backend desarrollado con Express.js, implementando arquitectura hexagonal y microservicios que se comunican mediante REST API. Incluye autenticación JWT y base de datos SQL Server, es una extensión de otro sistema web.

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