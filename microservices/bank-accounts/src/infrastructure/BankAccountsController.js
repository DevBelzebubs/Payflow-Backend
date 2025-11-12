class BankAccountsController {
  constructor(bankAccountsService) {
    this.bankAccountsService = bankAccountsService;
  }
  async getMyUnifiedAccounts(req, res) {
    try {
      const cuentas = await this.bankAccountsService.getMyUnifiedAccounts(req.user);
      res.status(200).json(cuentas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  async createCuentaBancaria(req, res) {
    try {
      const { cliente_id, banco, numero_cuenta, tipo_cuenta, titular } = req.body;

      if (!cliente_id || !banco || !numero_cuenta || !tipo_cuenta || !titular) {
        return res.status(400).json({
          error: 'Todos los campos son requeridos: cliente_id, banco, numero_cuenta, tipo_cuenta, titular'
        });
      }

      const cuenta = await this.bankAccountsService.createCuentaBancaria({
        cliente_id,
        banco,
        numero_cuenta,
        tipo_cuenta,
        titular,
        activo: true
      });

      res.status(201).json(cuenta.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getCuentaBancaria(req, res) {
    try {
      const { cuentaId } = req.params;

      const cuenta = await this.bankAccountsService.getCuentaBancariaById(cuentaId);

      if (!cuenta) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      res.status(200).json(cuenta.toJSON());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCuentasByCliente(req, res) {
    try {
      const { clienteId } = req.params;

      const cuentas = await this.bankAccountsService.getCuentasByCliente(clienteId);

      res.status(200).json(cuentas.map(c => c.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCuentaBancaria(req, res) {
    try {
      const { cuentaId } = req.params;
      const updateData = req.body;

      const cuenta = await this.bankAccountsService.updateCuentaBancaria(cuentaId, updateData);

      res.status(200).json(cuenta.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCuentaBancaria(req, res) {
    try {
      const { cuentaId } = req.params;

      await this.bankAccountsService.deleteCuentaBancaria(cuentaId);

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deactivateCuentaBancaria(req, res) {
    try {
      const { cuentaId } = req.params;

      const cuenta = await this.bankAccountsService.deactivateCuentaBancaria(cuentaId);

      res.status(200).json(cuenta.toJSON());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = BankAccountsController;
