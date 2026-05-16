// Carga variables de entorno antes de importar config.js
import 'dotenv/config';

// DATABASE_URL para tests — requiere una instancia de PostgreSQL separada.
// Configurar TEST_DATABASE_URL en .env.test o como variable de entorno.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// JWT_SECRET es requerido por config.js. En entorno de test usamos uno fijo
// para que las firmas sean reproducibles entre runs.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-do-not-use-in-production-32chars';
}

// NODE_ENV=test desactiva las validaciones de fortaleza de secretos.
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}
