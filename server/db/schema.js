import { pgTable, pgEnum, serial, text, integer, boolean, timestamp, real, index } from 'drizzle-orm/pg-core';

export const rolEnum   = pgEnum('rol',     ['admin', 'inmobiliaria', 'usuario']);
export const garantiaEnum = pgEnum('garantia', ['requerida', 'sin', 'ambas']);

export const ciudades = pgTable('ciudades', {
  id:         serial('id').primaryKey(),
  nombre:     text('nombre').notNull(),
  provincia:  text('provincia').notNull().default('Córdoba'),
  slug:       text('slug').notNull().unique(),
  activa:     boolean('activa').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id:            serial('id').primaryKey(),
  nombre:        text('nombre').notNull(),
  email:         text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  rol:           rolEnum('rol').notNull().default('usuario'),
  empresa:       text('empresa'),
  telefono:      text('telefono'),
  created_at:    timestamp('created_at').defaultNow(),
});

export const barrios = pgTable('barrios', {
  id:                  serial('id').primaryKey(),
  nombre:              text('nombre').notNull(),
  ciudad_id:           integer('ciudad_id').notNull().references(() => ciudades.id),
  x:                   real('x').notNull(),
  y:                   real('y').notNull(),
  precio_mes_anterior: integer('precio_mes_anterior').notNull().default(0),
});

export const properties = pgTable('properties', {
  id:                serial('id').primaryKey(),
  user_id:           integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ciudad_id:         integer('ciudad_id').notNull().references(() => ciudades.id),
  titulo:            text('titulo').notNull(),
  tipo:              text('tipo').notNull(),
  direccion:         text('direccion').notNull(),
  barrio:            text('barrio').notNull(),
  precio:            integer('precio').notNull(),
  precio_anterior:   integer('precio_anterior'),
  ambientes:         integer('ambientes').notNull().default(1),
  banos:             integer('banos').notNull().default(1),
  superficie:        integer('superficie').notNull().default(0),
  garantia:          garantiaEnum('garantia').notNull().default('requerida'),
  mascotas:          boolean('mascotas').notNull().default(false),
  amoblado:          boolean('amoblado').notNull().default(false),
  expensas_incluidas: boolean('expensas_incluidas').notNull().default(false),
  destacado:         boolean('destacado').notNull().default(false),
  liquidacion:       boolean('liquidacion').notNull().default(false),
  descripcion:       text('descripcion'),
  imagen:            text('imagen'),
  created_at:        timestamp('created_at').defaultNow(),
}, (t) => [
  index('idx_properties_ciudad_id').on(t.ciudad_id),
  index('idx_properties_tipo').on(t.tipo),
  index('idx_properties_barrio').on(t.barrio),
  index('idx_properties_precio').on(t.precio),
  index('idx_properties_created_at').on(t.created_at),
  index('idx_properties_user_id').on(t.user_id),
]);

export const banners = pgTable('banners', {
  id:        serial('id').primaryKey(),
  titulo:    text('titulo').notNull(),
  subtitulo: text('subtitulo'),
  color:     text('color').default('brand'),
  link:      text('link'),
  activo:    boolean('activo').notNull().default(true),
});

export const profesionales = pgTable('profesionales', {
  id:        serial('id').primaryKey(),
  nombre:    text('nombre').notNull(),
  rol:       text('rol').notNull(),
  matricula: text('matricula'),
  rating:    real('rating').default(5),
  iniciales: text('iniciales').notNull(),
  color:     text('color').default('brand'),
  telefono:  text('telefono'),
  email:     text('email'),
});
