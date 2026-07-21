require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Consul = require("consul");
const PORT = process.env.SERVICES_PORT || 3004;
const SERVICE_NAME = "services-service";
const HOST_IP = process.env.HOST_IP || "127.0.0.1";
const CONSUL_ID = `${SERVICE_NAME}-${HOST_IP}:${PORT}`;
const CONSUL_HOST = process.env.CONSUL_HOST || "localhost";

const consul = new Consul({ host: CONSUL_HOST, port: 8500 });
const app = express();

app.use(cors());
app.use(express.json());

const supabaseClient = require("../../database/supabaseClient");
const SqlServerServicesRepository = require("./src/infrastructure/adapters/outbound/repositories/SqlServerServicesRepository");
const SupabaseServicesRepository = require("./src/infrastructure/SupabaseServicesRepository");
const BcpServiceApiClient = require("./src/infrastructure/adapters/outbound/external/BcpServiceApiClient");
const ServicesService = require("./src/application/services/ServicesService");
const ServicesController = require("./src/infrastructure/adapters/inbound/ServicesController");
const authMiddleware = require("../shared/infrastructure/middleware/authMiddleware");
const blockDemo = require("../shared/infrastructure/middleware/blockDemo");

const useSupabase = process.env.DATABASE_PROVIDER === 'supabase';
const servicesRepository = useSupabase
  ? new SupabaseServicesRepository(supabaseClient)
  : new SqlServerServicesRepository();
const bcpServiceClient = new BcpServiceApiClient();
const servicesService = new ServicesService({ servicesRepository, bcpServiceClient });
const servicesController = new ServicesController(servicesService);

app.post("/api/servicios", authMiddleware, blockDemo, (req, res) =>
  servicesController.createServicio(req, res)
);
app.get("/api/servicios/externos/pendientes", (req, res) =>
  servicesController.getServiciosExternos(req, res)
);
app.get("/api/servicios/mis-deudas", authMiddleware, (req, res) =>
  servicesController.getMisDeudas(req, res)
);
app.get("/api/servicios/:idServicio", (req, res) =>
  servicesController.getServicio(req, res)
);
app.get("/api/servicios/:idServicio/butacas", (req, res) =>
  servicesController.getButacas(req, res)
);
app.get("/api/servicios", (req, res) =>
  servicesController.getAllServicios(req, res)
);
app.get("/api/servicios/:idServicio/tipos-entrada", (req, res) =>
  servicesController.getTiposEntrada(req, res)
);
app.put("/api/servicios/:idServicio", authMiddleware, blockDemo, (req, res) =>
  servicesController.updateServicio(req, res)
);
app.delete("/api/servicios/:idServicio", authMiddleware, blockDemo, (req, res) =>
  servicesController.deleteServicio(req, res)
);
app.patch("/api/servicios/:idServicio/marcar-pagado", authMiddleware, blockDemo, (req, res) =>
  servicesController.marcarComoPagado(req, res)
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
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
      interval: "10s",
      timeout: "5s",
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
process.on("SIGINT", () => {
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
