require('dotenv').config();
const express = require('express');
const cors = require('cors');

const SqlServerUsersRepository = require('./src/infrastructure/SqlServerUsersRepository');
const UsersService = require('./src/application/UsersService');
const UsersController = require('./src/infrastructure/UsersController');

const app = express();
const PORT = process.env.USERS_PORT || 3002;

app.use(cors());
app.use(express.json());

const usersRepository = new SqlServerUsersRepository();
const usersService = new UsersService(usersRepository);
const usersController = new UsersController(usersService);

app.post('/api/clientes', (req, res) => usersController.createCliente(req, res));
app.get('/api/clientes/usuario/:usuarioId', (req, res) => usersController.getClienteByUsuario(req, res));
app.put('/api/clientes/:clienteId', (req, res) => usersController.updateCliente(req, res));
app.get('/api/clientes', (req, res) => usersController.getAllClientes(req, res));

app.post('/api/administradores', (req, res) => usersController.createAdministrador(req, res));
app.get('/api/administradores/usuario/:usuarioId', (req, res) => usersController.getAdministradorByUsuario(req, res));
app.get('/api/administradores', (req, res) => usersController.getAllAdministradores(req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'users' });
});

app.listen(PORT, () => {
  console.log(`Users microservice running on port ${PORT}`);
});

module.exports = app;
