require('dotenv').config();
const express = require('express');
const cors = require('cors');

const SqlServerProductsRepository = require('./src/infrastructure/SqlServerProductsRepository');
const ProductsService = require('./src/application/ProductsService');
const ProductsController = require('./src/infrastructure/ProductsController');

const app = express();
const PORT = process.env.PRODUCTS_PORT || 3003;

app.use(cors());
app.use(express.json());

const productsRepository = new SqlServerProductsRepository();
const productsService = new ProductsService(productsRepository);
const productsController = new ProductsController(productsService);

app.post('/api/productos', (req, res) => productsController.createProducto(req, res));
app.get('/api/productos/:productoId', (req, res) => productsController.getProducto(req, res));
app.get('/api/productos', (req, res) => productsController.getAllProductos(req, res));
app.put('/api/productos/:productoId', (req, res) => productsController.updateProducto(req, res));
app.delete('/api/productos/:productoId', (req, res) => productsController.deleteProducto(req, res));
app.patch('/api/productos/:productoId/stock', (req, res) => productsController.updateStock(req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'products' });
});

app.listen(PORT, () => {
  console.log(`Products microservice running on port ${PORT}`);
});

module.exports = app;
