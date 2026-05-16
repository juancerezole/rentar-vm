import { z } from 'zod';

// Middleware factory: valida req.body contra un schema Zod
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0]?.message || 'datos inválidos';
      return res.status(400).json({ error: message });
    }
    req.body = result.data;
    next();
  };
}

// ── Schemas ────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  nombre:   z.string().min(2,  'El nombre debe tener al menos 2 caracteres.').max(100),
  email:    z.string().email('Email inválido.'),
  password: z.string().min(8,  'La contraseña debe tener al menos 8 caracteres.').max(128),
  rol:      z.enum(['usuario', 'inmobiliaria']).default('usuario'),
  empresa:  z.string().max(100).optional(),
  telefono: z.string().max(30).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email('Email inválido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
});

export const forgotSchema = z.object({
  email: z.string().email('Email inválido.'),
});

export const resetSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(128),
});

// Reglas reutilizables — el schema de creación las aplica con defaults
// (request completo), el de update las usa con .optional() (PATCH parcial).
const propertyFields = {
  titulo:            z.string().min(5, 'El título debe tener al menos 5 caracteres.').max(200),
  tipo:              z.string().min(1, 'Seleccioná un tipo de propiedad.'),
  direccion:         z.string().min(3, 'Ingresá una dirección válida.').max(200),
  barrio:            z.string().min(1, 'Seleccioná un barrio.'),
  precio:            z.coerce.number().int().positive('El precio debe ser mayor a cero.'),
  precio_anterior:   z.coerce.number().int().positive().nullable(),
  ambientes:         z.coerce.number().int().min(1).max(20),
  banos:             z.coerce.number().int().min(0).max(20),
  superficie:        z.coerce.number().int().min(0),
  garantia:          z.enum(['requerida', 'sin', 'ambas']),
  mascotas:          z.boolean(),
  amoblado:          z.boolean(),
  expensas_incluidas: z.boolean(),
  destacado:         z.boolean(),
  liquidacion:       z.boolean(),
  descripcion:       z.string().max(2000).nullable(),
  imagen:            z.string().url('URL de imagen inválida.').nullable().or(z.literal('')),
};

export const propertySchema = z.object({
  ...propertyFields,
  precio_anterior:   propertyFields.precio_anterior.optional(),
  ambientes:         propertyFields.ambientes.default(1),
  banos:             propertyFields.banos.default(1),
  superficie:        propertyFields.superficie.default(0),
  garantia:          propertyFields.garantia.default('requerida'),
  mascotas:          propertyFields.mascotas.default(false),
  amoblado:          propertyFields.amoblado.default(false),
  expensas_incluidas: propertyFields.expensas_incluidas.default(false),
  destacado:         propertyFields.destacado.default(false),
  liquidacion:       propertyFields.liquidacion.default(false),
  descripcion:       propertyFields.descripcion.optional(),
  imagen:            propertyFields.imagen.optional(),
});

// Para PATCH/PUT parcial: todos los campos opcionales, sin defaults.
// Lo que no viene no se toca — la semántica correcta de un update.
export const propertyUpdateSchema = z.object(propertyFields).partial();
