require('../../database/sqlServerConfig');
const express = require('express');
const cors = require('cors');

const Consul = require('consul');
const PORT = process.env.BANK_ACCOUNTS_PORT || 3006;
const SERVICE_NAME = 'bank-accounts-service';
const HOST_IP = process.env.HOST_IP || '127.0.0.1';
const CONSUL_ID = `${SERVICE_NAME}-${HOST_IP}:${PORT}`;
const CONSUL_HOST = process.env.CONSUL_HOST || 'localhost';
const consul = new Consul({ host: CONSUL_HOST, port: 8500 });

const authMiddleware = require('../auth/src/infrastructure/authMiddleware');

const SqlServerBankAccountsRepository = require('./src/infrastructure/SqlServerBankAccountsRepository');
const BankAccountsService = require('./src/application/BankAccountsService');
const BankAccountsController = require('./src/infrastructure/BankAccountsController');

const app = express();

app.use(cors());
app.use(express.json());

const bankAccountsRepository = new SqlServerBankAccountsRepository();
const bankAccountsService = new BankAccountsService(bankAccountsRepository);
const bankAccountsController = new BankAccountsController(bankAccountsService);

app.get('/api/cuentas-bancarias/mis-cuentas', authMiddleware, (req, res) => bankAccountsController.getMyUnifiedAccounts(req, res));
app.post('/api/cuentas-bancarias', (req, res) => bankAccountsController.createCuentaBancaria(req, res));
app.post('/api/cuentas-bancarias/debitar', authMiddleware, (req, res) => bankAccountsController.realizarDebito(req, res));
app.post('/api/cuentas-bancarias/recargar', authMiddleware, (req, res) => bankAccountsController.recargarMonedero(req, res));
app.get('/api/cuentas-bancarias/cliente/:clienteId', (req, res) => bankAccountsController.getCuentasByCliente(req, res));
app.get('/api/cuentas-bancarias/:cuentaId', (req, res) => bankAccountsController.getCuentaBancaria(req, res));
app.put('/api/cuentas-bancarias/:cuentaId', (req, res) => bankAccountsController.updateCuentaBancaria(req, res));
app.delete('/api/cuentas-bancarias/:cuentaId', (req, res) => bankAccountsController.deleteCuentaBancaria(req, res));
app.patch('/api/cuentas-bancarias/:cuentaId/deactivate', (req, res) => bankAccountsController.deactivateCuentaBancaria(req, res));

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