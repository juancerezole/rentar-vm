import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// === Schema ===========================================================
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('admin','inmobiliaria','usuario')) DEFAULT 'usuario',
  empresa TEXT,
  telefono TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS barrios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  precio_mes_anterior INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  direccion TEXT NOT NULL,
  barrio TEXT NOT NULL,
  precio INTEGER NOT NULL,
  precio_anterior INTEGER,
  ambientes INTEGER NOT NULL DEFAULT 1,
  banos INTEGER NOT NULL DEFAULT 1,
  superficie INTEGER NOT NULL DEFAULT 0,
  garantia TEXT NOT NULL DEFAULT 'requerida',
  mascotas INTEGER NOT NULL DEFAULT 0,
  amoblado INTEGER NOT NULL DEFAULT 0,
  expensas_incluidas INTEGER NOT NULL DEFAULT 0,
  destacado INTEGER NOT NULL DEFAULT 0,
  liquidacion INTEGER NOT NULL DEFAULT 0,
  descripcion TEXT,
  imagen TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  color TEXT DEFAULT 'from-emerald-500 to-emerald-700',
  link TEXT,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS profesionales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  matricula TEXT,
  rating REAL DEFAULT 5,
  iniciales TEXT NOT NULL,
  color TEXT DEFAULT 'brand',
  telefono TEXT,
  email TEXT
);
`);

// === Migrations =======================================================
// Agregan columnas/datos faltantes para DBs creadas con schemas anteriores.
function migrate() {
  // 1) columna precio_mes_anterior en barrios
  const barrioCols = db.prepare("PRAGMA table_info(barrios)").all().map(c => c.name);
  if (!barrioCols.includes('precio_mes_anterior')) {
    db.exec('ALTER TABLE barrios ADD COLUMN precio_mes_anterior INTEGER NOT NULL DEFAULT 0');
    console.log('[db] migración: agregada columna barrios.precio_mes_anterior');
  }
  // 2) emails viejos @alquilavm.com → @rentar.com.ar
  const oldEmails = db.prepare("SELECT COUNT(*) AS c FROM users WHERE email LIKE '%@alquilavm.com'").get().c;
  if (oldEmails > 0) {
    db.exec("UPDATE users SET email = REPLACE(email, '@alquilavm.com', '@rentar.com.ar') WHERE email LIKE '%@alquilavm.com'");
    console.log('[db] migración: actualizados', oldEmails, 'emails de usuarios');
  }
}

// === Seeds (idempotentes — cada uno corre solo si su tabla está vacía) =
const BARRIO_DELTAS = {
  'Centro': 217000, 'Belgrano': 188000, 'San Justo': 248000, 'Las Playas': 168000,
  'Carlos Pellegrini': 184000, 'Pueblo Nuevo': 222000, 'General Bustos': 280000,
  'Industrial': 808000, 'Roque Sáenz Peña': 195000, 'Felipe Botta': 232000,
};

function seedUsers() {
  const insertUser = db.prepare(
    'INSERT INTO users (nombre, email, password_hash, rol, empresa, telefono) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const ids = {};
  ids.adminId = Number(insertUser.run('Admin Demo', 'admin@rentar.com.ar', bcrypt.hashSync('admin123', 10), 'admin', null, '03534-000000').lastInsertRowid);
  ids.inmoId = Number(insertUser.run('Inmobiliaria Centro', 'inmo@rentar.com.ar', bcrypt.hashSync('inmo123', 10), 'inmobiliaria', 'Centro Propiedades', '03534-411-1111').lastInsertRowid);
  ids.inmo2Id = Number(insertUser.run('Propiedades del Sur', 'sur@rentar.com.ar', bcrypt.hashSync('sur123', 10), 'inmobiliaria', 'Propiedades del Sur', '03534-422-2222').lastInsertRowid);
  ids.inmo3Id = Number(insertUser.run('Inmobiliaria Vélez', 'velez@rentar.com.ar', bcrypt.hashSync('velez123', 10), 'inmobiliaria', 'Vélez Inmobiliaria', '03534-433-3333').lastInsertRowid);
  ids.inmo4Id = Number(insertUser.run('Bustos & Asoc.', 'bustos@rentar.com.ar', bcrypt.hashSync('bustos123', 10), 'inmobiliaria', 'Bustos & Asociados', '03534-444-4444').lastInsertRowid);
  insertUser.run('Usuario Demo', 'user@rentar.com.ar', bcrypt.hashSync('user123', 10), 'usuario', null, '03534-555-5555');
  return ids;
}

function seedBarrios() {
  const ins = db.prepare('INSERT INTO barrios (nombre, x, y, precio_mes_anterior) VALUES (?, ?, ?, ?)');
  const arr = [
    ['Centro',           50, 50],
    ['Belgrano',         30, 30],
    ['San Justo',        70, 30],
    ['Las Playas',       25, 65],
    ['Carlos Pellegrini',75, 60],
    ['Pueblo Nuevo',     40, 75],
    ['General Bustos',   60, 75],
    ['Industrial',       85, 45],
    ['Roque Sáenz Peña', 15, 45],
    ['Felipe Botta',     50, 20],
  ];
  arr.forEach(([nombre, x, y]) => ins.run(nombre, x, y, BARRIO_DELTAS[nombre] || 0));
}

// Asegura que los barrios existentes tengan precio_mes_anterior > 0
function ensureBarrioDeltas() {
  const upd = db.prepare('UPDATE barrios SET precio_mes_anterior = ? WHERE nombre = ? AND (precio_mes_anterior IS NULL OR precio_mes_anterior = 0)');
  for (const [nombre, val] of Object.entries(BARRIO_DELTAS)) upd.run(val, nombre);
}

function seedProperties(ids) {
  // si no recibimos ids (porque el seed de usuarios no corrió), buscamos los existentes por email/rol
  if (!ids) {
    const findInmo = (email) => db.prepare('SELECT id FROM users WHERE email = ?').get(email)?.id;
    const inmoIds = db.prepare("SELECT id FROM users WHERE rol = 'inmobiliaria' ORDER BY id LIMIT 4").all().map(r => r.id);
    if (inmoIds.length < 2) {
      console.warn('[db] saltando seed de propiedades: no hay inmobiliarias suficientes');
      return;
    }
    ids = {
      inmoId:  findInmo('inmo@rentar.com.ar')  || inmoIds[0],
      inmo2Id: findInmo('sur@rentar.com.ar')   || inmoIds[1] || inmoIds[0],
      inmo3Id: findInmo('velez@rentar.com.ar') || inmoIds[2] || inmoIds[0],
      inmo4Id: findInmo('bustos@rentar.com.ar')|| inmoIds[3] || inmoIds[0],
    };
  }
  const { inmoId, inmo2Id, inmo3Id, inmo4Id } = ids;
  const ins = db.prepare(`
    INSERT INTO properties (user_id, titulo, tipo, direccion, barrio, precio, precio_anterior, ambientes, banos, superficie, garantia, mascotas, amoblado, expensas_incluidas, destacado, liquidacion, descripcion, imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const IMG = {
    depto1: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900',
    depto2: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900',
    depto3: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900',
    depto4: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900',
    casa1:  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900',
    casa2:  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900',
    casa3:  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900',
    casa4:  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=900',
    duplex: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=900',
    duplex2:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900',
    cochera:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900',
    galpon: 'https://images.unsplash.com/photo-1565793979206-6d8505086e6c?w=900',
    local:  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900',
    local2: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=900',
    baulera:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900',
    campo:  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900',
    oficina:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900',
    mono:   'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900',
  };
  const props = [
    [inmoId,  'Departamento luminoso 2 amb. con balcón', 'departamento', 'Bv. Sarmiento 540', 'Centro', 280000, null, 2, 1, 55, 'requerida', 0, 1, 1, 1, 0, 'Departamento amoblado a metros de la peatonal. Ideal para profesionales.', IMG.depto1],
    [inmoId,  'Casa 3 ambientes con patio', 'casa', 'Belgrano 856', 'Belgrano', 295000, null, 3, 2, 110, 'requerida', 1, 0, 0, 1, 0, 'Casa con patio amplio, parrilla y cochera para 2 autos.', IMG.casa1],
    [inmo2Id, 'Monoambiente económico', 'departamento', 'Bv. Sarmiento 234', 'Las Playas', 145000, 175000, 1, 1, 32, 'sin', 0, 1, 1, 0, 1, 'Monoambiente sin garantía, ideal estudiantes. Liquidación por mudanza dueño.', IMG.mono],
    [inmo2Id, 'Dúplex moderno con cochera', 'duplex', 'San Martín 1502', 'San Justo', 410000, null, 4, 2, 145, 'ambas', 1, 0, 0, 1, 0, 'Dúplex a estrenar, todos los servicios, cochera doble.', IMG.duplex],
    [inmoId,  'Cochera cubierta', 'cochera', 'Mendoza 445', 'Centro', 35000, null, 1, 0, 14, 'sin', 0, 0, 0, 0, 0, 'Cochera cubierta en edificio con seguridad 24h.', IMG.cochera],
    [inmo2Id, 'Galpón industrial 600m²', 'galpon', 'Ruta 9 Km 562', 'Industrial', 850000, null, 1, 1, 600, 'requerida', 0, 0, 0, 0, 0, 'Galpón con oficinas, playa de maniobras y portón industrial.', IMG.galpon],
    [inmoId,  'Local comercial sobre peatonal', 'comercial', 'Buenos Aires 678', 'Centro', 380000, null, 2, 1, 65, 'requerida', 0, 0, 0, 0, 0, 'Local con vidriera al frente, depósito y baño.', IMG.local],
    [inmo2Id, 'Casa familiar zona tranquila', 'casa', 'Tucumán 1100', 'Pueblo Nuevo', 240000, 280000, 3, 1, 95, 'requerida', 1, 0, 0, 0, 1, 'Casa de 3 dormitorios, patio, lavadero. Liquidación por traslado.', IMG.casa2],
    [inmoId,  'Depto 1 dormitorio frente al parque', 'departamento', 'Av. Costanera 456', 'Carlos Pellegrini', 195000, null, 2, 1, 48, 'sin', 1, 0, 1, 1, 0, 'Vista al parque, sin garantía con seguro de caución.', IMG.depto3],
    [inmo2Id, 'Baulera con acceso 24h', 'baulera', 'Belgrano 200', 'Centro', 18000, null, 1, 0, 6, 'sin', 0, 0, 0, 0, 0, 'Baulera de 6m² en edificio céntrico.', IMG.baulera],
    [inmoId,  'Campo 8 has con casco', 'campo', 'Ruta 158 Km 18', 'San Justo', 550000, null, 4, 2, 80000, 'requerida', 1, 0, 0, 0, 0, 'Campo con casa principal, casa de cuidador, galpón y aguada.', IMG.campo],
    [inmo2Id, 'Casa con pileta y quincho', 'casa', 'Independencia 789', 'General Bustos', 295000, null, 3, 2, 130, 'ambas', 1, 0, 0, 0, 0, 'Casa con pileta, quincho y parrilla. Aceptamos mascotas.', IMG.casa3],
    [inmo3Id, 'Departamento 3 amb. nuevo a estrenar', 'departamento', 'Av. Vélez Sarsfield 1230', 'Belgrano', 340000, null, 3, 2, 78, 'requerida', 0, 0, 1, 1, 0, 'Departamento a estrenar, cocina integrada, balcón al frente.', IMG.depto2],
    [inmo3Id, 'Oficina moderna en torre céntrica', 'comercial', 'Olazábal 1500', 'Centro', 450000, null, 2, 1, 110, 'requerida', 0, 0, 1, 0, 0, 'Oficina con divisiones, sala de reuniones, cocina interna.', IMG.oficina],
    [inmo3Id, 'Dúplex reciclado 3 amb.', 'duplex', 'Corrientes 890', 'Felipe Botta', 285000, null, 3, 2, 75, 'ambas', 0, 1, 0, 0, 0, 'Dúplex reciclado, terminaciones de calidad, cochera incluida.', IMG.duplex2],
    [inmo3Id, 'Monoambiente céntrico estudiantes', 'departamento', 'Rivadavia 210', 'Centro', 160000, null, 1, 1, 32, 'sin', 0, 0, 1, 0, 0, 'Monoambiente nuevo, perfecto para estudiantes universitarios.', IMG.depto4],
    [inmo3Id, 'Local comercial esquina alto tránsito', 'comercial', 'San Martín 345', 'Centro', 580000, null, 2, 1, 60, 'requerida', 0, 0, 0, 1, 0, 'Local en esquina con doble vidriera, ideal cualquier rubro.', IMG.local2],
    [inmo4Id, 'Casa 4 dormitorios con jardín', 'casa', 'Av. Vélez 890', 'San Justo', 260000, 340000, 4, 2, 145, 'requerida', 1, 0, 0, 0, 1, 'Casa familiar con jardín delantero y patio. Liquidación por viaje.', IMG.casa4],
    [inmo4Id, 'Departamento 2 amb. con cochera', 'departamento', 'San Lorenzo 567', 'Roque Sáenz Peña', 220000, null, 2, 1, 60, 'ambas', 0, 0, 1, 0, 0, 'Depto con cochera fija, expensas incluidas.', IMG.depto1],
    [inmo4Id, 'Casa con cochera doble', 'casa', 'Mendoza 1450', 'Pueblo Nuevo', 310000, null, 3, 2, 120, 'requerida', 1, 0, 0, 0, 0, 'Casa con cochera doble, lavadero, patio trasero.', IMG.casa1],
    [inmo4Id, 'Departamento 1 amb. amoblado', 'departamento', 'Bv. Alvear 345', 'Felipe Botta', 175000, null, 1, 1, 38, 'sin', 0, 1, 1, 0, 0, 'Departamento amoblado completo, listo para ingresar.', IMG.depto2],
    [inmo4Id, 'Casa quinta con piscina', 'casa', 'Ruta 9 Sur Km 3', 'General Bustos', 580000, null, 4, 3, 220, 'requerida', 1, 0, 0, 1, 0, 'Casa quinta con pileta climatizada, parque arbolado.', IMG.casa3],
    [inmoId,  'Departamento 2 amb. zona universitaria', 'departamento', 'Lisandro de la Torre 678', 'Carlos Pellegrini', 215000, null, 2, 1, 52, 'sin', 0, 1, 0, 0, 0, 'Cerca de la UNVM, ideal para estudiantes con beca.', IMG.depto3],
    [inmo2Id, 'Local en zona comercial', 'comercial', 'San Martín 980', 'Centro', 320000, 380000, 1, 1, 45, 'requerida', 0, 0, 0, 0, 1, 'Local en zona de alto flujo. Bajo precio por desocupación.', IMG.local],
    [inmo3Id, 'Galpón mediano con oficinas', 'galpon', 'Av. Industrial 234', 'Industrial', 650000, null, 1, 1, 350, 'requerida', 0, 0, 0, 0, 0, 'Galpón con dos oficinas administrativas y baño.', IMG.galpon],
    [inmo4Id, 'Cochera cubierta zona centro', 'cochera', 'Buenos Aires 234', 'Centro', 42000, null, 1, 0, 16, 'sin', 0, 0, 0, 0, 0, 'Cochera cubierta a una cuadra de la peatonal.', IMG.cochera],
    [inmo3Id, 'Departamento penthouse vista panorámica', 'departamento', 'Mendoza 1820', 'Centro', 720000, null, 4, 3, 165, 'requerida', 0, 0, 1, 1, 0, 'Penthouse con terraza propia, vista panorámica de la ciudad.', IMG.depto4],
    [inmo2Id, 'Dúplex 4 amb. con cochera', 'duplex', 'Caseros 1234', 'Belgrano', 380000, null, 4, 2, 130, 'requerida', 1, 0, 0, 0, 0, 'Dúplex amplio en barrio tranquilo, cerca de colegios.', IMG.duplex],
  ];
  props.forEach(p => ins.run(...p));
}

function seedBanners() {
  const ins = db.prepare('INSERT INTO banners (titulo, subtitulo, color, link) VALUES (?, ?, ?, ?)');
  ins.run('Inmobiliaria Centro — Alquileres sin garantía', 'Más de 50 propiedades disponibles · Llamá ahora', 'brand', '#');
  ins.run('Banco Villa María — Préstamos personales', 'Hasta $5.000.000 con tasa preferencial · Aprobación online', 'blue', '#');
  ins.run('Mudanzas El Pampeano — Villa María y zona', 'Presupuestos sin cargo · Camiones de todo porte', 'orange', '#');
  ins.run('Constructora Sur — Departamentos a estrenar', 'Unidades en Belgrano desde $185.000 · Entrega inmediata', 'brand', '#');
}

function seedProfesionales() {
  const ins = db.prepare(`
    INSERT INTO profesionales (nombre, rol, matricula, rating, iniciales, color, telefono, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const profs = [
    ['Dr. Marcos López', 'Abogado civil e inmobiliario', 'Mat. 8432', 4.9, 'ML', 'brand', '03534-410-2030', 'mlopez@estudio.com.ar'],
    ['Arq. Ana García', 'Arquitecta · Tasaciones', 'Mat. 5217', 4.8, 'AG', 'blue', '03534-415-7788', 'agarcia@arq.com.ar'],
    ['Cra. Claudia Ramos', 'Contadora · Contratos AFIP', 'Mat. 12890', 4.9, 'CR', 'orange', '03534-422-1144', 'cramos@cpcecba.org.ar'],
    ['Ing. Juan Martín', 'Inspector de obras', 'Mat. 3104', 4.7, 'JM', 'gold', '03534-430-5566', 'jmartin@ing.com.ar'],
    ['Esc. Laura Fernández', 'Escribana pública', 'Reg. 6778', 5.0, 'LF', 'brand', '03534-414-9988', 'lfernandez@notaria.com.ar'],
    ['Mart. Pablo Rivero', 'Martillero público', 'Mat. 9543', 4.6, 'PR', 'blue', '03534-411-2233', 'privero@martilleros.com.ar'],
    ['Dra. Silvia Vega', 'Abogada · Locaciones', 'Mat. 14220', 4.8, 'SV', 'orange', '03534-417-3344', 'svega@estudio.com.ar'],
    ['Agr. Héctor Blanco', 'Agrimensor', 'Mat. 2891', 4.7, 'HB', 'brand', '03534-416-8855', 'hblanco@agrim.com.ar'],
  ];
  profs.forEach(p => ins.run(...p));
}

function tableEmpty(name) {
  return db.prepare(`SELECT COUNT(*) AS c FROM ${name}`).get().c === 0;
}

// === Run ==============================================================
migrate();

let ids = null;
if (tableEmpty('users')) {
  ids = seedUsers();
  console.log('[db] seed: usuarios creados');
}
if (tableEmpty('barrios')) {
  seedBarrios();
  console.log('[db] seed: barrios creados');
} else {
  ensureBarrioDeltas();
}
if (tableEmpty('properties')) {
  seedProperties(ids);
  console.log('[db] seed: propiedades creadas');
}
if (tableEmpty('banners')) {
  seedBanners();
  console.log('[db] seed: banners creados');
}
if (tableEmpty('profesionales')) {
  seedProfesionales();
  console.log('[db] seed: profesionales creados');
}

const finalCounts = {
  usuarios: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
  barrios: db.prepare('SELECT COUNT(*) AS c FROM barrios').get().c,
  propiedades: db.prepare('SELECT COUNT(*) AS c FROM properties').get().c,
  banners: db.prepare('SELECT COUNT(*) AS c FROM banners').get().c,
  profesionales: db.prepare('SELECT COUNT(*) AS c FROM profesionales').get().c,
};
console.log('[db] estado:', finalCounts);
