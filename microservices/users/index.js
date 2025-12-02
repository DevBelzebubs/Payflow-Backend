require("../../database/sqlServerConfig");
const express = require("express");
const cors = require("cors");
const Consul = require("consul");
const PORT = process.env.USERS_PORT || 3002;
const SERVICE_NAME = "users-service";
const HOST_IP = process.env.HOST_IP || "127.0.0.1";
const CONSUL_ID = `${SERVICE_NAME}-${HOST_IP}:${PORT}`;
const CONSUL_HOST = process.env.CONSUL_HOST || "localhost";

const consul = new Consul({ host: CONSUL_HOST, port: 8500 });
console.log("[Users] Cargando middleware...");
const authMiddleware = require("./src/infrastructure/authMiddleware");

console.log("[Users] Cargando UserRepo...");
const SqlServerUsersRepository = require("./src/infrastructure/SqlServerUsersRepository");

console.log("[Users] Cargando AuthRepo...");
const SqlServerAuthRepository = require("./src/infrastructure/SqlServerAuthRepository");

console.log("[Users] Cargando UserService...");
const UsersService = require("./src/application/UsersService");

console.log("[Users] Cargando UserController...");
const UsersController = require("./src/infrastructure/UsersController");

console.log("[Users] Creando app express...");
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const usersRepository = new SqlServerUsersRepository();
const authRepository = new SqlServerAuthRepository();

const usersService = new UsersService(usersRepository, authRepository);
const usersController = new UsersController(usersService);

app.post("/api/clientes/sync", authMiddleware, (req, res) =>
  usersController.syncBcpUser(req, res)
);
app.post("/api/clientes", (req, res) =>
  usersController.createCliente(req, res)
);
app.get("/api/clientes/usuario/:usuarioId", (req, res) =>
  usersController.getClienteByUsuario(req, res)
);
app.put("/api/clientes/:clienteId", (req, res) =>
  usersController.updateCliente(req, res)
);
app.put("/api/users/profile", authMiddleware, (req, res) =>
  usersController.updateProfile(req, res)
);
app.get("/api/clientes", (req, res) =>
  usersController.getAllClientes(req, res)
);
app.post("/api/administradores", (req, res) =>
  usersController.createAdministrador(req, res)
);
app.get("/api/administradores/usuario/:usuarioId", (req, res) =>
  usersController.getAdministradorByUsuario(req, res)
);
app.get("/api/administradores", (req, res) =>
  usersController.getAllAdministradores(req, res)
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
