require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const authMiddleware = require('../microservices/auth/src/infrastructure/authMiddleware');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

app.use(cors());
app.use(express.json());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3002';
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003';
const SERVICES_SERVICE_URL = process.env.SERVICES_SERVICE_URL || 'http://localhost:3004';
const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL || 'http://localhost:3005';
const BANK_ACCOUNTS_SERVICE_URL = process.env.BANK_ACCOUNTS_SERVICE_URL || 'http://localhost:3006';

const proxyRequest = async (serviceUrl, path, method, data, headers) => {
  try {
    const response = await axios({
      method,
      url: `${serviceUrl}${path}`,
      data,
      headers
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: error.message };
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const data = await proxyRequest(AUTH_SERVICE_URL, '/api/auth/register', 'POST', req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const data = await proxyRequest(AUTH_SERVICE_URL, '/api/auth/login', 'POST', req.body);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 401).json(error);
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const data = await proxyRequest(AUTH_SERVICE_URL, '/api/auth/verify', 'GET', null, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 401).json(error);
  }
});

app.post('/api/clientes/sync', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(USERS_SERVICE_URL, '/api/clientes/sync', 'POST', req.body, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.post('/api/clientes', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(USERS_SERVICE_URL, '/api/clientes', 'POST', req.body, req.headers);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.get('/api/clientes/:usuarioId', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(USERS_SERVICE_URL, `/api/clientes/usuario/${req.params.usuarioId}`, 'GET', null, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 404).json(error);
  }
});

app.get('/api/clientes', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(USERS_SERVICE_URL, '/api/clientes', 'GET', null, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.post('/api/administradores', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(USERS_SERVICE_URL, '/api/administradores', 'POST', req.body, req.headers);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.get('/api/productos', async (req, res) => {
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const data = await proxyRequest(PRODUCTS_SERVICE_URL, `/api/productos?${queryString}`, 'GET');
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.get('/api/productos/:productoId', async (req, res) => {
  try {
    const data = await proxyRequest(PRODUCTS_SERVICE_URL, `/api/productos/${req.params.productoId}`, 'GET');
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 404).json(error);
  }
});

app.post('/api/productos', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(PRODUCTS_SERVICE_URL, '/api/productos', 'POST', req.body, req.headers);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.put('/api/productos/:productoId', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(PRODUCTS_SERVICE_URL, `/api/productos/${req.params.productoId}`, 'PUT', req.body, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.delete('/api/productos/:productoId', authMiddleware, async (req, res) => {
  try {
    await proxyRequest(PRODUCTS_SERVICE_URL, `/api/productos/${req.params.productoId}`, 'DELETE', null, req.headers);
    res.status(204).send();
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.get('/api/servicios', async (req, res) => {
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const data = await proxyRequest(SERVICES_SERVICE_URL, `/api/servicios?${queryString}`, 'GET');
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.get('/api/servicios/:idServicio', async (req, res) => {
  try {
    const data = await proxyRequest(SERVICES_SERVICE_URL, `/api/servicios/${req.params.servicioId}`, 'GET');
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 404).json(error);
  }
});

app.post('/api/servicios', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(SERVICES_SERVICE_URL, '/api/servicios', 'POST', req.body, req.headers);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.put('/api/servicios/:servicioId', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(SERVICES_SERVICE_URL, `/api/servicios/${req.params.servicioId}`, 'PUT', req.body, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.delete('/api/servicios/:servicioId', authMiddleware, async (req, res) => {
  try {
    await proxyRequest(SERVICES_SERVICE_URL, `/api/servicios/${req.params.servicioId}`, 'DELETE', null, req.headers);
    res.status(204).send();
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.post('/api/ordenes', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(ORDERS_SERVICE_URL, '/api/ordenes', 'POST', req.body, req.headers);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.get('/api/ordenes/:ordenId', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(ORDERS_SERVICE_URL, `/api/ordenes/${req.params.ordenId}`, 'GET', null, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 404).json(error);
  }
});

app.get('/api/ordenes/cliente/:clienteId', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(ORDERS_SERVICE_URL, `/api/ordenes/cliente/${req.params.clienteId}`, 'GET', null, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.get('/api/ordenes', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(ORDERS_SERVICE_URL, '/api/ordenes', 'GET', null, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.patch('/api/ordenes/:ordenId/estado', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(ORDERS_SERVICE_URL, `/api/ordenes/${req.params.ordenId}/estado`, 'PATCH', req.body, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.post('/api/ordenes/:ordenId/cancelar', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(ORDERS_SERVICE_URL, `/api/ordenes/${req.params.ordenId}/cancelar`, 'POST', null, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.post('/api/cuentas-bancarias', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, '/api/cuentas-bancarias', 'POST', req.body, req.headers);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.get('/api/cuentas-bancarias/cliente/:clienteId', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, `/api/cuentas-bancarias/cliente/${req.params.clienteId}`, 'GET', null, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

app.get('/api/cuentas-bancarias/:cuentaId', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, `/api/cuentas-bancarias/${req.params.cuentaId}`, 'GET', null, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 404).json(error);
  }
});

app.put('/api/cuentas-bancarias/:cuentaId', authMiddleware, async (req, res) => {
  try {
    const data = await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, `/api/cuentas-bancarias/${req.params.cuentaId}`, 'PUT', req.body, req.headers);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.delete('/api/cuentas-bancarias/:cuentaId', authMiddleware, async (req, res) => {
  try {
    await proxyRequest(BANK_ACCOUNTS_SERVICE_URL, `/api/cuentas-bancarias/${req.params.cuentaId}`, 'DELETE', null, req.headers);
    res.status(204).send();
  } catch (error) {
    res.status(error.status || 400).json(error);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
});

module.exports = app;
