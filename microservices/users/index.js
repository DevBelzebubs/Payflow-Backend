require('dotenv').config();
const express = require('express');
const cors = require('cors');

console.log('[Users] Cargando middleware...');
const authMiddleware = require('./src/infrastructure/authMiddleware');

console.log('[Users] Cargando UserRepo...');
const SqlServerUsersRepository = require('./src/infrastructure/SqlServerUsersRepository');

console.log('[Users] Cargando AuthRepo...');
const SqlServerAuthRepository = require('./src/infrastructure/SqlServerAuthRepository');

console.log('[Users] Cargando UserService...');
const UsersService = require('./src/application/UsersService');

console.log('[Users] Cargando UserController...');
const UsersController = require('./src/infrastructure/UsersController');

console.log('[Users] Creando app express...');
const app = express();
const PORT = process.env.USERS_PORT || 3002;

app.use(cors());
app.use(express.json());

const usersRepository = new SqlServerUsersRepository();
const authRepository = new SqlServerAuthRepository();

const usersService = new UsersService(usersRepository,authRepository);
const usersController = new UsersController(usersService);

app.post('/api/clientes/sync', authMiddleware, (req, res) => usersController.syncBcpUser(req, res));
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
