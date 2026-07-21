require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Consul = require("consul");
const PORT = process.env.USERS_PORT || 3002;
const SERVICE_NAME = "users-service";
const HOST_IP = process.env.HOST_IP || "127.0.0.1";
const CONSUL_ID = `${SERVICE_NAME}-${HOST_IP}:${PORT}`;
const CONSUL_HOST = process.env.CONSUL_HOST || "localhost";

const consul = new Consul({ host: CONSUL_HOST, port: 8500 });

const authMiddleware = require("../shared/infrastructure/middleware/authMiddleware");
const requireAdmin = require("../shared/infrastructure/middleware/requireAdmin");
const blockDemo = require("../shared/infrastructure/middleware/blockDemo");

const supabaseClient = require("../../database/supabaseClient");
const SqlServerUsersRepository = require("./src/infrastructure/adapters/outbound/repositories/SqlServerUsersRepository");
const SqlServerAuthRepository = require("./src/infrastructure/adapters/outbound/repositories/SqlServerAuthRepository");
const SupabaseUsersRepository = require("./src/infrastructure/SupabaseUsersRepository");
const SupabaseAuthRepository = require("../auth/src/infrastructure/adapters/outbound/repositories/SupabaseAuthRepository");
const BankAccountServiceHttpClient = require("./src/infrastructure/adapters/outbound/external/BankAccountServiceHttpClient");
const BcryptPasswordHasher = require("../shared/infrastructure/BcryptPasswordHasher");
const UsersService = require("./src/application/services/UsersService");
const UsersController = require("./src/infrastructure/adapters/inbound/UsersController");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const useSupabase = process.env.DATABASE_PROVIDER === 'supabase';
const usersRepository = useSupabase
  ? new SupabaseUsersRepository(supabaseClient)
  : new SqlServerUsersRepository();
const authRepository = useSupabase
  ? new SupabaseAuthRepository(supabaseClient)
  : new SqlServerAuthRepository();
const bankAccountService = new BankAccountServiceHttpClient();
const passwordHasher = new BcryptPasswordHasher();

const usersService = new UsersService({
  usersRepository,
  authRepository,
  bankAccountService,
  passwordHasher,
});
const usersController = new UsersController(usersService);

app.post("/api/clientes/sync", authMiddleware, (req, res) =>
  usersController.syncBcpUser(req, res)
);
app.post("/api/clientes", authMiddleware, blockDemo, (req, res) =>
  usersController.createCliente(req, res)
);
app.get("/api/clientes/usuario/:usuarioId", (req, res) =>
  usersController.getClienteByUsuario(req, res)
);
app.put("/api/clientes/:clienteId", authMiddleware, blockDemo, (req, res) =>
  usersController.updateCliente(req, res)
);
app.put("/api/users/profile", authMiddleware, blockDemo, (req, res) =>
  usersController.updateProfile(req, res)
);
app.get("/api/clientes", (req, res) =>
  usersController.getAllClientes(req, res)
);
app.post("/api/administradores", authMiddleware, blockDemo, (req, res) =>
  usersController.createAdministrador(req, res)
);
app.get("/api/administradores/usuario/:usuarioId", (req, res) =>
  usersController.getAdministradorByUsuario(req, res)
);
app.get("/api/administradores", (req, res) =>
  usersController.getAllAdministradores(req, res)
);
app.get("/api/admin/usuarios", requireAdmin(), (req, res) =>
  usersController.getAllUsuarios(req, res)
);
app.get("/api/admin/usuarios/:id", requireAdmin(), (req, res) =>
  usersController.getUsuarioById(req, res)
);
app.put("/api/admin/usuarios/:id/rol", requireAdmin(), (req, res) =>
  usersController.updateUsuarioRol(req, res)
);
app.put("/api/admin/usuarios/:id/activo", requireAdmin(), (req, res) =>
  usersController.toggleUsuarioActivo(req, res)
);
app.get("/api/admin/stats", requireAdmin(), (req, res) =>
  usersController.getAdminStats(req, res)
);
app.delete("/api/admin/administradores/:adminId", requireAdmin(), (req, res) =>
  usersController.deleteAdministradorById(req, res)
);

app.get("/api/admin/verify", authMiddleware, (req, res) =>
  usersController.verifyAdmin(req, res)
);

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
