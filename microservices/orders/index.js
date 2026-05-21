require("../../database/sqlServerConfig");
const express = require("express");
const cors = require("cors");
const authMiddleware = require("../shared/infrastructure/middleware/authMiddleware");
const SqlServerOrdersRepository = require("./src/infrastructure/adapters/outbound/repositories/SqlServerOrdersRepository");
const ProductServiceHttpClient = require("./src/infrastructure/adapters/outbound/external/ProductServiceHttpClient");
const ServiceServiceHttpClient = require("./src/infrastructure/adapters/outbound/external/ServiceServiceHttpClient");
const BankAccountServiceHttpClient = require("./src/infrastructure/adapters/outbound/external/BankAccountServiceHttpClient");
const MercadoPagoHttpClient = require("./src/infrastructure/adapters/outbound/external/MercadoPagoHttpClient");
const BcpPaymentApiClient = require("./src/infrastructure/adapters/outbound/external/BcpPaymentApiClient");
const OrdersService = require("./src/application/services/OrdersService");
const OrdersController = require("./src/infrastructure/adapters/inbound/OrdersController");

const Consul = require("consul");
const PORT = process.env.ORDERS_PORT || 3005;
const SERVICE_NAME = "orders-service";
const HOST_IP = process.env.HOST_IP || "127.0.0.1";
const CONSUL_ID = `${SERVICE_NAME}-${HOST_IP}:${PORT}`;
const CONSUL_HOST = process.env.CONSUL_HOST || "localhost";

const consul = new Consul({ host: CONSUL_HOST, port: 8500 });

const app = express();

app.use(cors());
app.use(express.json());

const ordersRepository = new SqlServerOrdersRepository();
const productService = new ProductServiceHttpClient();
const serviceService = new ServiceServiceHttpClient();
const bankAccountService = new BankAccountServiceHttpClient();
const mercadopagoClient = new MercadoPagoHttpClient();
const bcpPaymentClient = new BcpPaymentApiClient();

const ordersService = new OrdersService({
  ordersRepository,
  productService,
  serviceService,
  bankAccountService,
  mercadopagoClient,
  bcpPaymentClient,
});
const ordersController = new OrdersController(ordersService);

app.post("/api/ordenes", authMiddleware, (req, res) =>
  ordersController.createOrden(req, res)
);
app.post("/api/ordenes/renovar-suscripciones", (req, res) =>
  ordersController.procesarRenovaciones(req, res)
);
app.post("/api/ordenes/webhook", (req, res) =>
  ordersController.receiveWebhook(req, res)
);
app.get("/api/ordenes/:ordenId", (req, res) =>
  ordersController.getOrden(req, res)
);
app.get("/api/ordenes/cliente/:clienteId", (req, res) =>
  ordersController.getOrdenesByCliente(req, res)
);
app.get("/api/ordenes", (req, res) => ordersController.getAllOrdenes(req, res));
app.get("/api/admin/ordenes/stats", (req, res) => ordersController.getSalesStats(req, res));
app.patch("/api/ordenes/:ordenId/estado", (req, res) =>
  ordersController.updateOrdenEstado(req, res)
);
app.post("/api/ordenes/:ordenId/cancelar", (req, res) =>
  ordersController.cancelOrden(req, res)
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: SERVICE_NAME });
});

const server = app.listen(PORT, () => {
  console.log(`Orders microservice running on port ${PORT}`);
  const serviceDefinition = {
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
  consul.agent.service.register(serviceDefinition, (err) => {
    if (err) {
      console.error(`[Consul] Failed to register service: ${err.message}`);
    } else {
      console.log(`[Consul] Service ${SERVICE_NAME} registered with ID ${CONSUL_ID}`);
    }
  });
});
process.on("SIGINT", () => {
  console.log(`[Consul] Deregistering service ${CONSUL_ID}`);
  consul.agent.service.deregister(CONSUL_ID, (err) => {
    if (err) console.error(`[Consul] Error deregistering: ${err.message}`);
    server.close(() => process.exit(0));
  });
});

module.exports = app;
