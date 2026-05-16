// Carga variables de entorno del .env antes de los tests
import 'dotenv/config';

// DATABASE_URL para tests — requiere una instancia de PostgreSQL separada
// Configurar TEST_DATABASE_URL en .env.test o como variable de entorno
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
