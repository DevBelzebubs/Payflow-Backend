const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios"); // <--- FIX 1: Importar axios

class AuthService {
  constructor(authRepository) {
    this.authRepository = authRepository;
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

    // --- FIX 2: Constructor limpiado y simplificado ---
    // URL para llamar al login público de BCP
    this.BCP_ROOT_URL = process.env.BCP_ROOT_URL || 'http://localhost:8080';
    // URL para sincronizar usuarios (llamada interna de microservicio)
    this.USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:3002";
    // --- FIN FIX 2 ---

    if (!this.JWT_SECRET) {
      throw new Error(
        "¡JWT_SECRET no está definido en .env! El servicio de Auth no puede iniciar."
      );
    }
  }

  async register(userData) {
    const existingUser = await this.authRepository.findUserByEmail(
      userData.email
    );

    if (existingUser) {
      throw new Error("El email ya está registrado");
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);

    const userToCreate = {
      email: userData.email,
      password_hash: passwordHash,
      nombre: userData.nombre,
      telefono: userData.telefono || null,
      activo: true,
      dni: userData.dni,
      rol: "CLIENTE",
    };

    const user = await this.authRepository.createUser(userToCreate);

    const token = this.generateToken(user, "PAYFLOW"); // Especificar userType

    return {
      user: user.toJSON(),
      token,
    };
  }

  async login(email, password) {
    try {
      console.log(`[AuthService] Intento 1: Buscando usuario Payflow local: ${email}`);
      const user = await this.authRepository.findUserByEmail(email);

      // Si el usuario es local (no es de BCP) Y la contraseña coincide
      if (user && user.passwordHash !== "SSO_BCP_USER") {
        if (!user.isActive()) {
          throw new Error("Usuario inactivo");
        }
        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );
        if (isPasswordValid) {
          console.log(`[AuthService] Éxito local (Payflow) para: ${email}`);
          const token = this.generateToken(user, "PAYFLOW");
          return {
            user: user.toJSON(),
            token,
          };
        }
      }

      // Si el usuario no es local, o es de BCP, o la contraseña local falló
      console.log(`[AuthService] Usuario local no encontrado o credencial inválida. Intento 2: BCP`);
      return await this.loginViaBcp(email, password);

    } catch (err) {
      // --- FIX 4: Mejorar el manejo de errores ---
      // Ya no ocultamos el error. Si loginViaBcp falla, lanzamos su error específico.
      console.error(`[AuthService] Fallo final de login para ${email}: ${err.message}`);
      // Esto propagará el error real (ej. "Error de sincronización...") al Gateway
      throw err;
      // --- FIN FIX 4 ---
    }
  }

  async loginViaBcp(email, password) {
    let bcpAuthResponse;
    try {
      console.log(`[AuthService] Llamando a BCP Login en: ${this.BCP_ROOT_URL}/auth/login`);
      bcpAuthResponse = await axios.post(`${this.BCP_ROOT_URL}/auth/login`, {
        nombre: email,
        contrasena: password,
      });
    } catch (BcpError) {
      console.error(
        `[AuthService] Fallo de autenticación en BCP: ${BcpError.message}`
      );
      throw new Error("Credenciales inválidas (BCP)");
    }

    const bcpToken = bcpAuthResponse.data?.token;
    if (!bcpToken) {
      throw new Error("BCP no devolvió un token");
    }

    console.log("[AuthService] BCP Login OK. Sincronizando usuario...");
    let syncResponse;
    try {
      syncResponse = await axios.post(
        `${this.USERS_SERVICE_URL}/api/clientes/sync`,
        {},
        { headers: { Authorization: `Bearer ${bcpToken}` } }
      );
    } catch (syncError) {
      console.error(
        `[AuthService] Error sincronizando usuario BCP: ${syncError.message}`
      );
       if (syncError.response && syncError.response.data) {
           throw new Error(`Error de sincronización: ${syncError.response.data.error || syncError.message}`);
       }
      throw new Error("Error al sincronizar el perfil de BCP");
    }

    const syncedCliente = syncResponse.data; 
    if (!syncedCliente || !syncedCliente.correo) {
         throw new Error("La sincronización no devolvió un email.");
    }

    const emailReal = syncedCliente.correo; 
    console.log(`[AuthService] Sincronización OK. Buscando usuario localmente por email real: ${emailReal}`);

    const user = await this.authRepository.findUserByEmail(emailReal); 
    
    if (!user) {
       throw new Error('La sincronización falló, el usuario no se encuentra localmente (Inconsistencia de BBDD).');
    }

    console.log(`[AuthService] Éxito de login (BCP) para: ${emailReal}`);
    const payflowToken = this.generateToken(user, 'BCP');

    return {
      user: user.toJSON(),
      token: payflowToken
    };
  }

  generateToken(user, userType = 'PAYFLOW') {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        rol: user.rol,
        dni: user.dni,
        userType: userType
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error("Token inválido o expirado");
    }
  }
}

module.exports = AuthService;