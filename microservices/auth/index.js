require('dotenv').config();

const express = require('express');
const cors = require('cors');

const supabaseClient = require('../../database/supabaseClient');
const SqlServerAuthRepository = require('./src/infrastructure/adapters/outbound/repositories/SqlServerAuthRepository');
const SupabaseAuthRepository = require('./src/infrastructure/adapters/outbound/repositories/SupabaseAuthRepository');
const BcryptPasswordHasher = require('../shared/infrastructure/BcryptPasswordHasher');
const JwtTokenGenerator = require('../shared/infrastructure/JwtTokenGenerator');
const BcpAuthApiClient = require('./src/infrastructure/adapters/outbound/external/BcpAuthApiClient');
const UserServiceHttpClient = require('./src/infrastructure/adapters/outbound/external/UserServiceHttpClient');
const AuthService = require('./src/application/services/AuthService');
const AuthController = require('./src/infrastructure/adapters/inbound/AuthController');

const Consul = require('consul');
const PORT = process.env.AUTH_PORT || 3001;
const SERVICE_NAME = 'auth-service';
const HOST_IP = process.env.HOST_IP || '127.0.0.1';
const CONSUL_ID = `${SERVICE_NAME}-${HOST_IP}:${PORT}`;
const CONSUL_HOST = process.env.CONSUL_HOST || 'localhost';

const consul = new Consul({ host: CONSUL_HOST, port: 8500 });
const app = express();

app.use(cors());
app.use(express.json());

const useSupabase = process.env.DATABASE_PROVIDER === 'supabase';
const authRepository = useSupabase
  ? new SupabaseAuthRepository(supabaseClient)
  : new SqlServerAuthRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenGenerator = new JwtTokenGenerator();
const bcpAuthClient = new BcpAuthApiClient();
const userServiceClient = new UserServiceHttpClient();

const authService = new AuthService({
  authRepository,
  passwordHasher,
  tokenGenerator,
  bcpAuthClient,
  userServiceClient,
});

const authController = new AuthController(authService);

app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));
app.post('/api/auth/demo-login', (req, res) => authController.demoLogin(req, res));
app.get('/api/auth/verify', (req, res) => authController.verifyToken(req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: SERVICE_NAME });
});

const server = app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} microservice running on port ${PORT}`);
  const registration = {
    id: CONSUL_ID,
    name: SERVICE_NAME,
    address: HOST_IP,
    port: parseInt(PORT),
    check: {
      http: `http://${HOST_IP}:${PORT}/health`,
      interval: '10s',
      timeout: '5s',
    },
  };
  consul.agent.service.register(registration, (err) => {
    if (err) {
      console.error(`[Consul] Failed to register ${SERVICE_NAME}: ${err.message}`);
    } else {
      console.log(`[Consul] Successfully registered ${SERVICE_NAME} with ID ${CONSUL_ID}`);
    }
  });
});
process.on('SIGINT', () => {
  console.log(`\n[Consul] Deregistering ${CONSUL_ID}`);
  consul.agent.service.deregister(CONSUL_ID, (err) => {
    if (err) {
      console.error(`[Consul] Error deregistering ${CONSUL_ID}: ${err.message}`);
    } else {
      console.log(`[Consul] Successfully deregistered ${CONSUL_ID}`);
    }
    server.close(() => process.exit(0));
  });
});

module.exports = app;
