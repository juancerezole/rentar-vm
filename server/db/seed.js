import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db } from './index.js';
import { ciudades, users, barrios, properties, banners, profesionales } from './schema.js';

async function tableEmpty(table) {
  const [{ c }] = await db.select({ c: sql`count(*)::int` }).from(table);
  return c === 0;
}

async function seedCiudades() {
  const [ciudad] = await db.insert(ciudades).values({
    nombre: 'Villa María',
    provincia: 'Córdoba',
    slug: 'villa-maria',
    activa: true,
  }).returning({ id: ciudades.id });
  console.log('[db] seed: ciudad Villa María creada');
  return ciudad.id;
}

async function seedUsers() {
  const hash = (p) => bcrypt.hashSync(p, 10);
  const rows = await db.insert(users).values([
    { nombre: 'Admin Demo',         email: 'admin@rentar.com.ar', password_hash: hash('admin123'), rol: 'admin',        empresa: null,                  telefono: '03534-000000' },
    { nombre: 'Inmobiliaria Centro',email: 'inmo@rentar.com.ar',  password_hash: hash('inmo123'),  rol: 'inmobiliaria', empresa: 'Centro Propiedades',   telefono: '03534-411-1111' },
    { nombre: 'Propiedades del Sur', email: 'sur@rentar.com.ar',  password_hash: hash('sur123'),   rol: 'inmobiliaria', empresa: 'Propiedades del Sur',  telefono: '03534-422-2222' },
    { nombre: 'Inmobiliaria Vélez', email: 'velez@rentar.com.ar', password_hash: hash('velez123'), rol: 'inmobiliaria', empresa: 'Vélez Inmobiliaria',   telefono: '03534-433-3333' },
    { nombre: 'Bustos & Asoc.',     email: 'bustos@rentar.com.ar',password_hash: hash('bustos123'),rol: 'inmobiliaria', empresa: 'Bustos & Asociados',  telefono: '03534-444-4444' },
    { nombre: 'Usuario Demo',       email: 'user@rentar.com.ar',  password_hash: hash('user123'),  rol: 'usuario',      empresa: null,                  telefono: '03534-555-5555' },
  ]).returning({ id: users.id });
  console.log('[db] seed: usuarios creados');
  return { inmoId: rows[1].id, inmo2Id: rows[2].id, inmo3Id: rows[3].id, inmo4Id: rows[4].id };
}

const BARRIO_DATA = [
  { nombre: 'Centro',            x: 50, y: 50, precio_mes_anterior: 217000 },
  { nombre: 'Belgrano',          x: 30, y: 30, precio_mes_anterior: 188000 },
  { nombre: 'San Justo',         x: 70, y: 30, precio_mes_anterior: 248000 },
  { nombre: 'Las Playas',        x: 25, y: 65, precio_mes_anterior: 168000 },
  { nombre: 'Carlos Pellegrini', x: 75, y: 60, precio_mes_anterior: 184000 },
  { nombre: 'Pueblo Nuevo',      x: 40, y: 75, precio_mes_anterior: 222000 },
  { nombre: 'General Bustos',    x: 60, y: 75, precio_mes_anterior: 280000 },
  { nombre: 'Industrial',        x: 85, y: 45, precio_mes_anterior: 808000 },
  { nombre: 'Roque Sáenz Peña',  x: 15, y: 45, precio_mes_anterior: 195000 },
  { nombre: 'Felipe Botta',      x: 50, y: 20, precio_mes_anterior: 232000 },
];

async function seedBarrios(ciudadId) {
  await db.insert(barrios).values(BARRIO_DATA.map(b => ({ ...b, ciudad_id: ciudadId })));
  console.log('[db] seed: barrios creados');
}

async function seedProperties(ciudadId, { inmoId, inmo2Id, inmo3Id, inmo4Id }) {
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

  const p = (user_id, titulo, tipo, direccion, barrio, precio, precio_anterior, ambientes, banos, superficie, garantia, mascotas, amoblado, expensas_incluidas, destacado, liquidacion, descripcion, imagen) =>
    ({ ciudad_id: ciudadId, user_id, titulo, tipo, direccion, barrio, precio, precio_anterior, ambientes, banos, superficie, garantia, mascotas, amoblado, expensas_incluidas, destacado, liquidacion, descripcion, imagen });

  await db.insert(properties).values([
    p(inmoId,  'Departamento luminoso 2 amb. con balcón',    'departamento','Bv. Sarmiento 540',       'Centro',           280000,null,2,1,55, 'requerida',false,true, true, true, false,'Departamento amoblado a metros de la peatonal. Ideal para profesionales.',IMG.depto1),
    p(inmoId,  'Casa 3 ambientes con patio',                  'casa',        'Belgrano 856',            'Belgrano',         295000,null,3,2,110,'requerida',true, false,false,true, false,'Casa con patio amplio, parrilla y cochera para 2 autos.',               IMG.casa1),
    p(inmo2Id,'Monoambiente económico',                       'departamento','Bv. Sarmiento 234',       'Las Playas',       145000,175000,1,1,32,'sin',     false,true, true, false,true, 'Monoambiente sin garantía, ideal estudiantes. Liquidación por mudanza dueño.',IMG.mono),
    p(inmo2Id,'Dúplex moderno con cochera',                   'duplex',      'San Martín 1502',         'San Justo',        410000,null,4,2,145,'ambas',    true, false,false,true, false,'Dúplex a estrenar, todos los servicios, cochera doble.',                IMG.duplex),
    p(inmoId,  'Cochera cubierta',                            'cochera',     'Mendoza 445',             'Centro',            35000,null,1,0,14, 'sin',     false,false,false,false,false,'Cochera cubierta en edificio con seguridad 24h.',                       IMG.cochera),
    p(inmo2Id,'Galpón industrial 600m²',                      'galpon',      'Ruta 9 Km 562',           'Industrial',       850000,null,1,1,600,'requerida',false,false,false,false,false,'Galpón con oficinas, playa de maniobras y portón industrial.',          IMG.galpon),
    p(inmoId,  'Local comercial sobre peatonal',              'comercial',   'Buenos Aires 678',        'Centro',           380000,null,2,1,65, 'requerida',false,false,false,false,false,'Local con vidriera al frente, depósito y baño.',                        IMG.local),
    p(inmo2Id,'Casa familiar zona tranquila',                 'casa',        'Tucumán 1100',            'Pueblo Nuevo',     240000,280000,3,1,95,'requerida',true, false,false,false,true, 'Casa de 3 dormitorios, patio, lavadero. Liquidación por traslado.',    IMG.casa2),
    p(inmoId,  'Depto 1 dormitorio frente al parque',         'departamento','Av. Costanera 456',       'Carlos Pellegrini',195000,null,2,1,48, 'sin',     true, false,true, true, false,'Vista al parque, sin garantía con seguro de caución.',                  IMG.depto3),
    p(inmo2Id,'Baulera con acceso 24h',                       'baulera',     'Belgrano 200',            'Centro',            18000,null,1,0,6,  'sin',     false,false,false,false,false,'Baulera de 6m² en edificio céntrico.',                                  IMG.baulera),
    p(inmoId,  'Campo 8 has con casco',                       'campo',       'Ruta 158 Km 18',          'San Justo',        550000,null,4,2,80000,'requerida',true,false,false,false,false,'Campo con casa principal, casa de cuidador, galpón y aguada.',          IMG.campo),
    p(inmo2Id,'Casa con pileta y quincho',                    'casa',        'Independencia 789',       'General Bustos',   295000,null,3,2,130,'ambas',    true, false,false,false,false,'Casa con pileta, quincho y parrilla. Aceptamos mascotas.',              IMG.casa3),
    p(inmo3Id,'Departamento 3 amb. nuevo a estrenar',         'departamento','Av. Vélez Sarsfield 1230','Belgrano',         340000,null,3,2,78, 'requerida',false,false,true, true, false,'Departamento a estrenar, cocina integrada, balcón al frente.',          IMG.depto2),
    p(inmo3Id,'Oficina moderna en torre céntrica',            'comercial',   'Olazábal 1500',           'Centro',           450000,null,2,1,110,'requerida',false,false,true, false,false,'Oficina con divisiones, sala de reuniones, cocina interna.',            IMG.oficina),
    p(inmo3Id,'Dúplex reciclado 3 amb.',                      'duplex',      'Corrientes 890',          'Felipe Botta',     285000,null,3,2,75, 'ambas',    false,true, false,false,false,'Dúplex reciclado, terminaciones de calidad, cochera incluida.',          IMG.duplex2),
    p(inmo3Id,'Monoambiente céntrico estudiantes',            'departamento','Rivadavia 210',           'Centro',           160000,null,1,1,32, 'sin',     false,false,true, false,false,'Monoambiente nuevo, perfecto para estudiantes universitarios.',          IMG.depto4),
    p(inmo3Id,'Local comercial esquina alto tránsito',        'comercial',   'San Martín 345',          'Centro',           580000,null,2,1,60, 'requerida',false,false,false,true, false,'Local en esquina con doble vidriera, ideal cualquier rubro.',           IMG.local2),
    p(inmo4Id,'Casa 4 dormitorios con jardín',                'casa',        'Av. Vélez 890',           'San Justo',        260000,340000,4,2,145,'requerida',true,false,false,false,true, 'Casa familiar con jardín delantero y patio. Liquidación por viaje.',   IMG.casa4),
    p(inmo4Id,'Departamento 2 amb. con cochera',              'departamento','San Lorenzo 567',         'Roque Sáenz Peña', 220000,null,2,1,60, 'ambas',    false,false,true, false,false,'Depto con cochera fija, expensas incluidas.',                            IMG.depto1),
    p(inmo4Id,'Casa con cochera doble',                       'casa',        'Mendoza 1450',            'Pueblo Nuevo',     310000,null,3,2,120,'requerida',true, false,false,false,false,'Casa con cochera doble, lavadero, patio trasero.',                      IMG.casa1),
    p(inmo4Id,'Departamento 1 amb. amoblado',                 'departamento','Bv. Alvear 345',          'Felipe Botta',     175000,null,1,1,38, 'sin',     false,true, true, false,false,'Departamento amoblado completo, listo para ingresar.',                  IMG.depto2),
    p(inmo4Id,'Casa quinta con piscina',                      'casa',        'Ruta 9 Sur Km 3',         'General Bustos',   580000,null,4,3,220,'requerida',true, false,false,true, false,'Casa quinta con pileta climatizada, parque arbolado.',                  IMG.casa3),
    p(inmoId,  'Departamento 2 amb. zona universitaria',      'departamento','Lisandro de la Torre 678','Carlos Pellegrini',215000,null,2,1,52, 'sin',     false,true, false,false,false,'Cerca de la UNVM, ideal para estudiantes con beca.',                    IMG.depto3),
    p(inmo2Id,'Local en zona comercial',                      'comercial',   'San Martín 980',          'Centro',           320000,380000,1,1,45,'requerida',false,false,false,false,true, 'Local en zona de alto flujo. Bajo precio por desocupación.',          IMG.local),
    p(inmo3Id,'Galpón mediano con oficinas',                  'galpon',      'Av. Industrial 234',      'Industrial',       650000,null,1,1,350,'requerida',false,false,false,false,false,'Galpón con dos oficinas administrativas y baño.',                       IMG.galpon),
    p(inmo4Id,'Cochera cubierta zona centro',                 'cochera',     'Buenos Aires 234',        'Centro',            42000,null,1,0,16, 'sin',     false,false,false,false,false,'Cochera cubierta a una cuadra de la peatonal.',                         IMG.cochera),
    p(inmo3Id,'Departamento penthouse vista panorámica',      'departamento','Mendoza 1820',            'Centro',           720000,null,4,3,165,'requerida',false,false,true, true, false,'Penthouse con terraza propia, vista panorámica de la ciudad.',          IMG.depto4),
    p(inmo2Id,'Dúplex 4 amb. con cochera',                    'duplex',      'Caseros 1234',            'Belgrano',         380000,null,4,2,130,'requerida',true, false,false,false,false,'Dúplex amplio en barrio tranquilo, cerca de colegios.',                 IMG.duplex),
  ]);
  console.log('[db] seed: propiedades creadas');
}

async function seedBanners() {
  await db.insert(banners).values([
    { titulo: 'Inmobiliaria Centro — Alquileres sin garantía', subtitulo: 'Más de 50 propiedades disponibles · Llamá ahora',          color: 'brand',  link: '#' },
    { titulo: 'Banco Villa María — Préstamos personales',       subtitulo: 'Hasta $5.000.000 con tasa preferencial · Aprobación online', color: 'blue',   link: '#' },
    { titulo: 'Mudanzas El Pampeano — Villa María y zona',      subtitulo: 'Presupuestos sin cargo · Camiones de todo porte',           color: 'orange', link: '#' },
    { titulo: 'Constructora Sur — Departamentos a estrenar',    subtitulo: 'Unidades en Belgrano desde $185.000 · Entrega inmediata',   color: 'brand',  link: '#' },
  ]);
  console.log('[db] seed: banners creados');
}

async function seedProfesionales() {
  await db.insert(profesionales).values([
    { nombre: 'Dr. Marcos López',    rol: 'Abogado civil e inmobiliario', matricula: 'Mat. 8432',  rating: 4.9, iniciales: 'ML', color: 'brand',  telefono: '03534-410-2030', email: 'mlopez@estudio.com.ar' },
    { nombre: 'Arq. Ana García',     rol: 'Arquitecta · Tasaciones',      matricula: 'Mat. 5217',  rating: 4.8, iniciales: 'AG', color: 'blue',   telefono: '03534-415-7788', email: 'agarcia@arq.com.ar' },
    { nombre: 'Cra. Claudia Ramos',  rol: 'Contadora · Contratos AFIP',   matricula: 'Mat. 12890', rating: 4.9, iniciales: 'CR', color: 'orange', telefono: '03534-422-1144', email: 'cramos@cpcecba.org.ar' },
    { nombre: 'Ing. Juan Martín',    rol: 'Inspector de obras',           matricula: 'Mat. 3104',  rating: 4.7, iniciales: 'JM', color: 'gold',   telefono: '03534-430-5566', email: 'jmartin@ing.com.ar' },
    { nombre: 'Esc. Laura Fernández',rol: 'Escribana pública',            matricula: 'Reg. 6778',  rating: 5.0, iniciales: 'LF', color: 'brand',  telefono: '03534-414-9988', email: 'lfernandez@notaria.com.ar' },
    { nombre: 'Mart. Pablo Rivero',  rol: 'Martillero público',           matricula: 'Mat. 9543',  rating: 4.6, iniciales: 'PR', color: 'blue',   telefono: '03534-411-2233', email: 'privero@martilleros.com.ar' },
    { nombre: 'Dra. Silvia Vega',    rol: 'Abogada · Locaciones',         matricula: 'Mat. 14220', rating: 4.8, iniciales: 'SV', color: 'orange', telefono: '03534-417-3344', email: 'svega@estudio.com.ar' },
    { nombre: 'Agr. Héctor Blanco',  rol: 'Agrimensor',                   matricula: 'Mat. 2891',  rating: 4.7, iniciales: 'HB', color: 'brand',  telefono: '03534-416-8855', email: 'hblanco@agrim.com.ar' },
  ]);
  console.log('[db] seed: profesionales creados');
}

export async function initDb() {
  console.log('[db] verificando estado inicial...');

  let ciudadId;
  if (await tableEmpty(ciudades)) {
    ciudadId = await seedCiudades();
  } else {
    const [c] = await db.select({ id: ciudades.id }).from(ciudades).limit(1);
    ciudadId = c.id;
  }

  let inmoIds = null;
  if (await tableEmpty(users)) {
    inmoIds = await seedUsers();
  }

  if (await tableEmpty(barrios)) {
    await seedBarrios(ciudadId);
  }

  if (await tableEmpty(properties)) {
    if (!inmoIds) {
      // La tabla de usuarios ya existía: buscamos los IDs por email
      const findId = async (email) => {
        const [u] = await db.select({ id: users.id }).from(users).where(sql`email = ${email}`);
        return u?.id;
      };
      inmoIds = {
        inmoId:  await findId('inmo@rentar.com.ar'),
        inmo2Id: await findId('sur@rentar.com.ar'),
        inmo3Id: await findId('velez@rentar.com.ar'),
        inmo4Id: await findId('bustos@rentar.com.ar'),
      };
    }
    await seedProperties(ciudadId, inmoIds);
  }

  if (await tableEmpty(banners))       await seedBanners();
  if (await tableEmpty(profesionales)) await seedProfesionales();

  console.log('[db] listo ✓');
}
