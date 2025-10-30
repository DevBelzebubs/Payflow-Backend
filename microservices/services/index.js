require('dotenv').config();
const express = require('express');
const cors = require('cors');

const SqlServerServicesRepository = require('./src/infrastructure/SqlServerServicesRepository');
const ServicesService = require('./src/application/ServicesService');
const ServicesController = require('./src/infrastructure/ServicesController');

const app = express();
const PORT = process.env.SERVICES_PORT || 3004;

app.use(cors());
app.use(express.json());

const servicesRepository = new SqlServerServicesRepository();
const servicesService = new ServicesService(servicesRepository);
const servicesController = new ServicesController(servicesService);

app.post('/api/servicios', (req, res) => servicesController.createServicio(req, res));
app.get('/api/servicios/:servicioId', (req, res) => servicesController.getServicio(req, res));
app.get('/api/servicios', (req, res) => servicesController.getAllServicios(req, res));
app.put('/api/servicios/:servicioId', (req, res) => servicesController.updateServicio(req, res));
app.delete('/api/servicios/:servicioId', (req, res) => servicesController.deleteServicio(req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'services' });
});

app.listen(PORT, () => {
  console.log(`Services microservice running on port ${PORT}`);
});

module.exports = app;
