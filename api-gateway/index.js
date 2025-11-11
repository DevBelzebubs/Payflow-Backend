const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
let server;
try {

  const express = require('express');
  const cors = require('cors');
  const axios = require('axios');
  const authMiddleware = require('../microservices/auth/src/infrastructure/authMiddleware');

  const app = express();
  const PORT = process.env.API_GATEWAY_PORT || 3000;

  console.log(`[Gateway] ¿Se cargó JWT_SECRET? ${process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 5) + '...' : 'NO (undefined)'}`);

  app.use(cors());
  app.use(express.json());

  const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3002';
  const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003';
  const SERVICES_SERVICE_URL = process.env.SERVICES_SERVICE_URL || 'http://localhost:3004';
  const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL || 'http://localhost:3005';
  const BANK_ACCOUNTS_SERVICE_URL = process.env.BANK_ACCOUNTS_SERVICE_URL || 'http://localhost:3006';

  const proxyRequest = async (serviceUrl, path, method, data, originalHeaders) => {
    try {
      
      const headersToSend = {
        'Content-Type': 'application/json',
      };
  
      if (originalHeaders && originalHeaders.authorization) {
        headersToSend['Authorization'] = originalHeaders.authorization;
      }
  
      const response = await axios({
        method,
        url: `${serviceUrl}${path}`,
        data,
        headers: headersToSend
      });
      return response.data;
    } catch (error) {
      console.error(`[Gateway Proxy Error] Error al contactar ${serviceUrl}${path}`);
      const status = error.response?.status || 500;
      const responseError = error.response?.data || { error: error.message };
      // Re-lanza un objeto de error estandarizado
      throw { ...responseError, status };
    }
  };

  // --- INICIO DE RUTAS ---
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = await proxyRequest(AUTH_SERVICE_URL, '/api/auth/register', 'POST', req.body);
      res.status(201).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/auth/register:", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = await proxyRequest(AUTH_SERVICE_URL, '/api/auth/login', 'POST', req.body);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/auth/login:", error);
      res.status(error.status || 401).json(error);
    }
  });
  
  app.get('/api/auth/verify', async (req, res) => {
    try {
      const data = await proxyRequest(AUTH_SERVICE_URL, '/api/auth/verify', 'GET', null, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/auth/verify:", error);
      res.status(error.status || 401).json(error);
    }
  });
  
  app.post('/api/clientes/sync', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(USERS_SERVICE_URL, '/api/clientes/sync', 'POST', req.body, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/clientes/sync:", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.post('/api/clientes', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(USERS_SERVICE_URL, '/api/clientes', 'POST', req.body, req.headers);
      res.status(201).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/clientes (POST):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.get('/api/clientes/:usuarioId', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(USERS_SERVICE_URL, `/api/clientes/usuario/${req.params.usuarioId}`, 'GET', null, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/clientes/:usuarioId (GET):", error);
      res.status(error.status || 404).json(error);
    }
  });
  
  app.get('/api/clientes', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(USERS_SERVICE_URL, '/api/clientes', 'GET', null, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/clientes (GET):", error);
      res.status(error.status || 500).json(error);
    }
  });
  
  app.post('/api/administradores', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(USERS_SERVICE_URL, '/api/administradores', 'POST', req.body, req.headers);
      res.status(201).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/administradores (POST):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.get('/api/productos', async (req, res) => {
    try {
      const queryString = new URLSearchParams(req.query).toString();
      const data = await proxyRequest(PRODUCTS_SERVICE_URL, `/api/productos?${queryString}`, 'GET');
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/productos (GET):", error);
      res.status(error.status || 500).json(error);
    }
  });
  
  app.get('/api/productos/:productoId', async (req, res) => {
    try {
      const data = await proxyRequest(PRODUCTS_SERVICE_URL, `/api/productos/${req.params.productoId}`, 'GET');
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/productos/:productoId (GET):", error);
      res.status(error.status || 404).json(error);
    }
  });
  
  app.post('/api/productos', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(PRODUCTS_SERVICE_URL, '/api/productos', 'POST', req.body, req.headers);
      res.status(201).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/productos (POST):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.put('/api/productos/:productoId', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(PRODUCTS_SERVICE_URL, `/api/productos/${req.params.productoId}`, 'PUT', req.body, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/productos/:productoId (PUT):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.delete('/api/productos/:productoId', authMiddleware, async (req, res) => {
    try {
      await proxyRequest(PRODUCTS_SERVICE_URL, `/api/productos/${req.params.productoId}`, 'DELETE', null, req.headers);
      res.status(204).send();
    } catch (error) {
      console.error("[Gateway] Error en /api/productos/:productoId (DELETE):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.get('/api/servicios', async (req, res) => {
    try {
      const queryString = new URLSearchParams(req.query).toString();
      const data = await proxyRequest(SERVICES_SERVICE_URL, `/api/servicios?${queryString}`, 'GET');
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/servicios (GET):", error);
      res.status(error.status || 500).json(error);
    }
  });
  
  app.get('/api/servicios/:idServicio', async (req, res) => {
    try {
      const data = await proxyRequest(SERVICES_SERVICE_URL, `/api/servicios/${req.params.idServicio}`, 'GET');
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/servicios/:idServicio (GET):", error);
      res.status(error.status || 404).json(error);
    }
  });
  
  app.post('/api/servicios', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(SERVICES_SERVICE_URL, '/api/servicios', 'POST', req.body, req.headers);
      res.status(201).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/servicios (POST):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.put('/api/servicios/:servicioId', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(SERVICES_SERVICE_URL, `/api/servicios/${req.params.servicioId}`, 'PUT', req.body, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/servicios/:servicioId (PUT):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.delete('/api/servicios/:servicioId', authMiddleware, async (req, res) => {
    try {
      await proxyRequest(SERVICES_SERVICE_URL, `/api/servicios/${req.params.servicioId}`, 'DELETE', null, req.headers);
      res.status(204).send();
    } catch (error) {
      console.error("[Gateway] Error en /api/servicios/:servicioId (DELETE):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.post('/api/ordenes', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(ORDERS_SERVICE_URL, '/api/ordenes', 'POST', req.body, req.headers);
      res.status(201).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/ordenes (POST):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.get('/api/ordenes/:ordenId', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(ORDERS_SERVICE_URL, `/api/ordenes/${req.params.ordenId}`, 'GET', null, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/ordenes/:ordenId (GET):", error);
      res.status(error.status || 404).json(error);
    }
  });
  
  app.get('/api/ordenes/cliente/:clienteId', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(ORDERS_SERVICE_URL, `/api/ordenes/cliente/${req.params.clienteId}`, 'GET', null, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/ordenes/cliente/:clienteId (GET):", error);
      res.status(error.status || 500).json(error);
    }
  });
  
  app.get('/api/ordenes', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(ORDERS_SERVICE_URL, '/api/ordenes', 'GET', null, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/ordenes (GET):", error);
      res.status(error.status || 500).json(error);
    }
  });
  
  app.patch('/api/ordenes/:ordenId/estado', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(ORDERS_SERVICE_URL, `/api/ordenes/${req.params.ordenId}/estado`, 'PATCH', req.body, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/ordenes/:ordenId/estado (PATCH):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.post('/api/ordenes/:ordenId/cancelar', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(ORDERS_SERVICE_URL, `/api/ordenes/${req.params.ordenId}/cancelar`, 'POST', null, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/ordenes/:ordenId/cancelar (POST):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.post('/api/cuentas-bancarias', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, '/api/cuentas-bancarias', 'POST', req.body, req.headers);
      res.status(201).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/cuentas-bancarias (POST):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.get('/api/cuentas-bancarias/cliente/:clienteId', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, `/api/cuentas-bancarias/cliente/${req.params.clienteId}`, 'GET', null, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/cuentas-bancarias/cliente/:clienteId (GET):", error);
      res.status(error.status || 500).json(error);
    }
  });
  
  app.get('/api/cuentas-bancarias/:cuentaId', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, `/api/cuentas-bancarias/${req.params.cuentaId}`, 'GET', null, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/cuentas-bancarias/:cuentaId (GET):", error);
      res.status(error.status || 404).json(error);
    }
  });
  
  app.put('/api/cuentas-bancarias/:cuentaId', authMiddleware, async (req, res) => {
    try {
      const data = await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, `/api/cuentas-bancarias/${req.params.cuentaId}`, 'PUT', req.body, req.headers);
      res.status(200).json(data);
    } catch (error) {
      console.error("[Gateway] Error en /api/cuentas-bancarias/:cuentaId (PUT):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.delete('/api/cuentas-bancarias/:cuentaId', authMiddleware, async (req, res) => {
    try {
      await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, `/api/cuentas-bancarias/${req.params.cuentaId}`, 'DELETE', null, req.headers);
      res.status(204).send();
    } catch (error) {
      console.error("[Gateway] Error en /api/cuentas-bancarias/:cuentaId (DELETE):", error);
      res.status(error.status || 400).json(error);
    }
  });
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
  });
  
  // --- FIN DE RUTAS ---

  server = app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Access the API at http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('!!!!!!!! GATEWAY FAILED TO START !!!!!!!!');
    console.error(err);
    process.exit(1);
  });

  module.exports = app;

} catch (e) {
  console.error('!!!!!!!! GATEWAY CRASHED ON BOOT !!!!!!!!');
  console.error(e);
  process.exit(1);
}

process.on('uncaughtException', (err, origin) => {
  console.error('!!!!!!!! GATEWAY: Uncaught Exception !!!!!!!!');
  console.error(`Caught exception: ${err}\n` + `Exception origin: ${origin}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('!!!!!!!! GATEWAY: Unhandled Rejection !!!!!!!!');
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});