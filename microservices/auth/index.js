const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const SqlServerAuthRepository = require('./src/infrastructure/SqlServerAuthRepository');
const AuthService = require('./src/application/AuthService');
const AuthController = require('./src/infrastructure/AuthController');

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

app.use(cors());
app.use(express.json());

const authRepository = new SqlServerAuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));
app.get('/api/auth/verify', (req, res) => authController.verifyToken(req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

app.listen(PORT, () => {
  console.log(`Auth microservice running on port ${PORT}`);
});

module.exports = app;
