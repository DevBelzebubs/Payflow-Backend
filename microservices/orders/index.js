require('../../database/sqlServerConfig');
const express = require('express');
const cors = require('cors');
const authMiddleware = require('../auth/src/infrastructure/authMiddleware');
const SqlServerOrdersRepository = require('./src/infrastructure/SqlServerOrdersRepository');
const OrdersService = require('./src/application/OrdersService');
const OrdersController = require('./src/infrastructure/OrdersController');

const app = express();
const PORT = process.env.ORDERS_PORT || 3005;

app.use(cors());
app.use(express.json());

const ordersRepository = new SqlServerOrdersRepository();
const ordersService = new OrdersService(ordersRepository);
const ordersController = new OrdersController(ordersService);

app.post('/api/ordenes', authMiddleware, (req, res) => ordersController.createOrden(req, res));
app.post('/api/ordenes/webhook', (req, res) => ordersController.receiveWebhook(req, res));
app.get('/api/ordenes/:ordenId', (req, res) => ordersController.getOrden(req, res));
app.get('/api/ordenes/cliente/:clienteId', (req, res) => ordersController.getOrdenesByCliente(req, res));
app.get('/api/ordenes', (req, res) => ordersController.getAllOrdenes(req, res));
app.patch('/api/ordenes/:ordenId/estado', (req, res) => ordersController.updateOrdenEstado(req, res));
app.post('/api/ordenes/:ordenId/cancelar', (req, res) => ordersController.cancelOrden(req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'orders' });
});

app.listen(PORT, () => {
  console.log(`Orders microservice running on port ${PORT}`);
});

module.exports = app;
