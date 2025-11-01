require('dotenv').config(); // Carga tu archivo .env
const { getPool, sql, closePool } = require('./database/sqlServerConfig'); // Llama a tu config

async function testConnection() {
  let pool;
  try {
    console.log(`Intentando conectar a: ${process.env.DB_SERVER}...`);
    console.log(`Base de datos: ${process.env.DB_DATABASE}`);
    console.log(`Usuario: ${process.env.DB_USER}`);
    console.log(`Usando Autenticación SQL.`);

    pool = await getPool();
    console.log("\n✅ ¡Conexión exitosa!");

    console.log("\nIntentando consultar la tabla 'servicios'...");
    const result = await pool.request().query('SELECT TOP 1 * FROM servicios');

    if (result.recordset.length > 0) {
      console.log("✅ ¡Consulta exitosa! Se encontró al menos un servicio.");
      console.log(result.recordset[0]);
    } else {
      console.warn("⚠️  La conexión funcionó, pero la tabla 'servicios' está vacía o no existe.");
      console.warn("   (Esto es lo que causa el error 404 en tu API)");
    }

  } catch (err) {
    console.error("\n❌ ¡ERROR DE CONEXIÓN O CONSULTA!");
    console.error("---------------------------------");
    // Imprime el error específico
    console.error(`Código: ${err.code}`);
    console.error(`Mensaje: ${err.message}`);
    console.error("---------------------------------");
    console.error("\nRevisa la 'Checklist de Depuración' para solucionar esto.");
  } finally {
    if (pool) {
      await closePool();
    }
  }
}

testConnection();