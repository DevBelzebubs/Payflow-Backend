const Money = require('../../../../shared/domain/value-objects/Money');

class BankAccountsService {
  constructor({ bankAccountsRepository, bcpAccountClient }) {
    this.bankAccountsRepository = bankAccountsRepository;
    this.bcpAccountClient = bcpAccountClient;
  }

  async realizarDebitoInterno(clienteId, cuentaId, montoADebitar) {
    if (montoADebitar <= 0) throw new Error('El monto a debitar debe ser positivo.');

    const cuenta = await this.bankAccountsRepository.findCuentaParaDebito(cuentaId, clienteId);
    if (!cuenta) throw new Error('Cuenta no encontrada o no pertenece al cliente.');

    const montoFinal = cuenta.debitar(montoADebitar);
    await this.bankAccountsRepository.updateSaldo(cuentaId, cuenta.saldo.toFloat());

    const descripcionCompra = cuenta.esMonederoPayflow()
      ? 'Compra con Monedero Payflow (20% Dcto.)'
      : 'Compra de producto payflow';

    return {
      idPago: null,
      servicio: descripcionCompra,
      montoPagado: montoFinal,
      fecha: new Date().toISOString().split('T')[0],
      codigoAutorizacion: `PF-INT-${Date.now()}`,
    };
  }

  async getMyUnifiedAccounts(userTokenData) {
    const { userId, dni } = userTokenData;
    if (!userId) throw new Error('Token inválido, no se encontró userId.');

    const localAccountsPromise = this.bankAccountsRepository
      .findCuentasByUsuarioId(userId)
      .then(accounts => accounts.map(acc => ({ ...acc.toJSON(), origen: 'PAYFLOW' })))
      .catch(err => {
        console.error('Error al buscar cuentas locales:', err.message);
        return [];
      });

    let bcpAccountsPromise = Promise.resolve([]);
    if (dni) {
      bcpAccountsPromise = this.bcpAccountClient
        .getAccountsByDni(dni)
        .then(cuentas => cuentas.map(acc => ({ ...acc, origen: 'BCP' })))
        .catch(err => {
          console.error('Error al buscar cuentas BCP:', err.message);
          return [];
        });
    }

    const [localAccounts, bcpAccounts] = await Promise.all([localAccountsPromise, bcpAccountsPromise]);
    return [...localAccounts, ...bcpAccounts];
  }

  async recargarMonedero(userTokenData, cuentaOrigenId, monto) {
    const { clienteId, dni } = userTokenData;
    if (monto <= 0) throw new Error('El monto debe ser mayor a 0.');

    const monedero = await this.bankAccountsRepository.findMonederoByClienteId(clienteId);
    if (!monedero) throw new Error('No se encontró un Monedero Payflow activo.');

    let cuentaOrigen = null;
    try {
      cuentaOrigen = await this.bankAccountsRepository.findCuentaBancariaById(cuentaOrigenId);
    } catch (error) {}

    if (cuentaOrigen && cuentaOrigen.id === monedero.id) {
      throw new Error('No puedes recargar el monedero usando el mismo monedero.');
    }

    const origenEsBCP = cuentaOrigen ? cuentaOrigen.banco === 'BCP' : true;

    if (origenEsBCP) {
      if (!dni) throw new Error('Se requiere DNI para operar con BCP.');
      const numeroCuentaOrigen = cuentaOrigen ? cuentaOrigen.numeroCuenta : cuentaOrigenId;
      await this.bcpAccountClient.ejecutarDebito({
        dniCliente: dni,
        numeroCuentaOrigen,
        monto,
        descripcionCompra: 'Recarga Payflow Wallet',
        idPagoBCP: 0,
        idServicioPayflow: 'WALLET-RECHARGE',
      });
    } else {
      if (!cuentaOrigen) throw new Error('Cuenta de origen Payflow no encontrada.');
      cuentaOrigen.debitar(monto);
      await this.bankAccountsRepository.updateSaldo(cuentaOrigen.id, cuentaOrigen.saldo.toFloat());
    }

    await this.bankAccountsRepository.incrementarSaldo(monedero.id, monto);
    return {
      mensaje: 'Recarga exitosa',
      nuevoSaldo: monedero.saldo.add(new Money(monto)).toFloat(),
      monederoId: monedero.id,
    };
  }

  async createCuentaBancaria(cuentaData) { return await this.bankAccountsRepository.createCuentaBancaria(cuentaData); }
  async getCuentaBancariaById(cuentaId) { return await this.bankAccountsRepository.findCuentaBancariaById(cuentaId); }
  async getCuentasByCliente(clienteId) { return await this.bankAccountsRepository.findCuentasByCliente(clienteId); }
  async updateCuentaBancaria(cuentaId, cuentaData) { return await this.bankAccountsRepository.updateCuentaBancaria(cuentaId, cuentaData); }
  async deleteCuentaBancaria(cuentaId) { return await this.bankAccountsRepository.deleteCuentaBancaria(cuentaId); }
  async deactivateCuentaBancaria(cuentaId) { return await this.bankAccountsRepository.updateCuentaBancaria(cuentaId, { activo: false }); }
}

module.exports = BankAccountsService;
