const axios = require("axios");
class UsersService {
  constructor(usersRepository, authRepository) {
    this.usersRepository = usersRepository;
    this.authRepository = authRepository;
    this.BANK_ACCOUNTS_SERVICE_URL = process.env.BANK_ACCOUNTS_SERVICE_URL || "http://localhost:3006";
  }
  async findOrCreateClienteFromBcp(bcpUserData) {
    const { email, dni, bcpUsuarioId, nombreCompleto, telefono } = bcpUserData;

    if (!email) {
      throw new Error("El token JWT de BCP no contiene el claim 'email'.");
    }
    if (!dni) {
      throw new Error("El token JWT de BCP no contiene el claim 'dni'.");
    }
    let payflowUser = await this.authRepository.findUserByEmail(email);
    if (!payflowUser) {
      console.log(`Usuario de BCP no encontrado (${email}). Creando...`);
      const newUserPayload = {
        email: email,
        password_hash: "SSO_BCP_USER",
        nombre: nombreCompleto,
        telefono: telefono,
        activo: true,
        dni: dni,
        rol: "CLIENTE",
      };
      try {
        payflowUser = await this.authRepository.createUser(newUserPayload);
      } catch (createError) {
        console.error(
          `[UsersService] Fallo al crear usuario: ${createError.message}`
        );
        throw new Error(
          `Fallo de SQL al crear usuario: ${createError.message}`
        );
      }
    }
    let payflowCliente = await this.usersRepository.findClienteByUsuarioId(payflowUser.id);
    let isNewUser = false;
    if (!payflowCliente) {
      console.log(`Perfil de Cliente no encontrado para ${email}. Creando...`);
      payflowCliente = await this.usersRepository.createCliente(payflowUser);
      isNewUser = true;
      try{
        console.log(`Creando Monedero Payflow para cliente ${payflowCliente.id}...`);
        const walletData = {
          cliente_id: payflowCliente.id,
          banco: "Monedero Payflow",
          numero_cuenta: `WALLET-${payflowUser.id.substring(0, 8)}`,
          tipo_cuenta: "ahorro",
          titular: payflowUser.nombre,
          activo: true
        };
        await axios.post(`${this.BANK_ACCOUNTS_SERVICE_URL}/api/cuentas-bancarias`,walletData);
        console.log("Monedero creado");
      }catch(err){
        console.error(err.message);
        throw new Error(`Error al crear el monedero: ${err.response?.data?.error || err.message}`);
      }
    }
    return { cliente: payflowCliente, isNewUser };
  }
  async createCliente(clienteData) {
    const payflowCliente = await this.usersRepository.createCliente(clienteData);
    try {
      const walletData = {
        cliente_id : payflowCliente.id,
        banco: "Monedero payflow",
        numero_cuenta : `WALLET-${payflowCliente.usuarioId.substring(0,8)}`,
        tipo_cuenta: "ahorro",
        titular: payflowCliente.nombre,
        activo:true
      }
      await axios.post(`${this.BANK_ACCOUNTS_SERVICE_URL}/api/cuentas-bancarias`,walletData)
    } catch (walletError) {
        console.error(
        `[UsersService] CRÍTICO: El cliente ${payflowCliente.id} se creó, pero falló la creación de su monedero: ${walletError.message}`
      );
      throw new Error(`El cliente se creó, pero no se pudo generar el monedero: ${walletError.response?.data?.error || walletError.message}`);
    }
    return payflowCliente;
  }

  async getClienteByUsuarioId(usuarioId) {
    return await this.usersRepository.findClienteByUsuarioId(usuarioId);
  }

  async updateCliente(clienteId, clienteData) {
    return await this.usersRepository.updateCliente(clienteId, clienteData);
  }

  async getAllClientes() {
    return await this.usersRepository.findAllClientes();
  }

  async createAdministrador(adminData) {
    return await this.usersRepository.createAdministrador(adminData);
  }

  async getAdministradorByUsuarioId(usuarioId) {
    return await this.usersRepository.findAdministradorByUsuarioId(usuarioId);
  }

  async getAllAdministradores() {
    return await this.usersRepository.findAllAdministradores();
  }
}

module.exports = UsersService;
