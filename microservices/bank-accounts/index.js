require('dotenv').config({ path: '../../.env' });const express = require('express');
const cors = require('cors');

const SqlServerBankAccountsRepository = require('./src/infrastructure/SqlServerBankAccountsRepository');
const BankAccountsService = require('./src/application/BankAccountsService');
const BankAccountsController = require('./src/infrastructure/BankAccountsController');

const app = express();
const PORT = process.env.BANK_ACCOUNTS_PORT || 3006;

app.use(cors());
app.use(express.json());

const bankAccountsRepository = new SqlServerBankAccountsRepository();
const bankAccountsService = new BankAccountsService(bankAccountsRepository);
const bankAccountsController = new BankAccountsController(bankAccountsService);

app.post('/api/cuentas-bancarias', (req, res) => bankAccountsController.createCuentaBancaria(req, res));
app.get('/api/cuentas-bancarias/:cuentaId', (req, res) => bankAccountsController.getCuentaBancaria(req, res));
app.get('/api/cuentas-bancarias/cliente/:clienteId', (req, res) => bankAccountsController.getCuentasByCliente(req, res));
app.put('/api/cuentas-bancarias/:cuentaId', (req, res) => bankAccountsController.updateCuentaBancaria(req, res));
app.delete('/api/cuentas-bancarias/:cuentaId', (req, res) => bankAccountsController.deleteCuentaBancaria(req, res));
app.patch('/api/cuentas-bancarias/:cuentaId/deactivate', (req, res) => bankAccountsController.deactivateCuentaBancaria(req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bank-accounts' });
});

app.listen(PORT, () => {
  console.log(`Bank Accounts microservice running on port ${PORT}`);
});

module.exports = app;
