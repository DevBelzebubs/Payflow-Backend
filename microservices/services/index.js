require("../../database/sqlServerConfig");
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

const SqlServerServicesRepository = require("./src/infrastructure/SqlServerServicesRepository");
const ServicesService = require("./src/application/ServicesService");
const ServicesController = require("./src/infrastructure/ServicesController");
const authMiddleware = require("./src/infrastructure/authMiddleware");

const servicesRepository = new SqlServerServicesRepository();
const servicesService = new ServicesService(servicesRepository);
const servicesController = new ServicesController(servicesService);

app.post("/api/servicios", (req, res) =>
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
app.get("/api/servicios/:idServicio/butacas", (req, res) =>
  servicesController.getButacas(req, res)
);
app.get("/api/servicios/:idServicio/tipos-entrada", (req, res) =>
  servicesController.getTiposEntrada(req, res)
);
app.put("/api/servicios/:idServicio", (req, res) =>
  servicesController.updateServicio(req, res)
);
app.delete("/api/servicios/:idServicio", (req, res) =>
  servicesController.deleteServicio(req, res)
);
app.patch("/api/servicios/:idServicio/marcar-pagado", (req, res) =>
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
      console.error(
        `[Consul] Failed to register ${SERVICE_NAME}: ${err.message}`
      );
    } else {
      console.log(
        `[Consul] Successfully registered ${SERVICE_NAME} with ID ${CONSUL_ID}`
      );
    }
  });
});
process.on("SIGINT", () => {
  console.log(`\n[Consul] Deregistering ${CONSUL_ID}`);
  consul.agent.service.deregister(CONSUL_ID, (err) => {
    if (err) {
      console.error(
        `[Consul] Error deregistering ${CONSUL_ID}: ${err.message}`
      );
    } else {
      console.log(`[Consul] Successfully deregistered ${CONSUL_ID}`);
    }
    server.close(() => process.exit(0));
  });
});

module.exports = app;
