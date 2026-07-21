require('dotenv').config();
const express = require('express');
const cors = require('cors');

const supabaseClient = require('../../database/supabaseClient');
const SqlServerProductsRepository = require('./src/infrastructure/adapters/outbound/repositories/SqlServerProductsRepository');
const SupabaseProductsRepository = require('./src/infrastructure/adapters/outbound/repositories/SupabaseProductsRepository');
const ProductsService = require('./src/application/services/ProductsService');
const ProductsController = require('./src/infrastructure/adapters/inbound/ProductsController');
const fileUpload = require('express-fileupload');

const authMiddleware = require('../shared/infrastructure/middleware/authMiddleware');
const blockDemo = require('../shared/infrastructure/middleware/blockDemo');

const app = express();
const PORT = process.env.PRODUCTS_PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(fileUpload({ createParentPath: true, tempFileDir: '/tmp/' }));

const useSupabase = process.env.DATABASE_PROVIDER === 'supabase';
const productsRepository = useSupabase
  ? new SupabaseProductsRepository(supabaseClient)
  : new SqlServerProductsRepository();
const productsService = new ProductsService({ productsRepository });
const productsController = new ProductsController(productsService);

app.post('/api/productos', authMiddleware, blockDemo, (req, res) => productsController.createProducto(req, res));
app.get('/api/productos', (req, res) => productsController.getAllProductos(req, res));
app.get('/api/productos/:productoId', (req, res) => productsController.getProducto(req, res));
app.put('/api/productos/:productoId', authMiddleware, blockDemo, (req, res) => productsController.updateProducto(req, res));
app.delete('/api/productos/:productoId', authMiddleware, blockDemo, (req, res) => productsController.deleteProducto(req, res));
app.patch('/api/productos/:productoId/stock', authMiddleware, blockDemo, (req, res) => productsController.updateStock(req, res));

app.post('/api/productos/:productoId/resenas', authMiddleware, blockDemo, (req, res) => productsController.createResena(req, res));
app.put('/api/resenas/:resenaId', authMiddleware, blockDemo, (req, res) => productsController.updateResena(req, res));
app.delete('/api/resenas/:resenaId', authMiddleware, blockDemo, (req, res) => productsController.deleteResena(req, res));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'products' });
});

app.listen(PORT, () => {
  console.log(`Products microservice running on port ${PORT}`);
});

module.exports = app;
