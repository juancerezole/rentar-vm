-- Agrega FK properties.barrio_id → barrios.id manteniendo la columna `barrio`
-- (text) por compatibilidad con queries existentes. En una migración futura
-- (cuando todo el código lea barrio_id) se puede hacer NOT NULL y/o dropear
-- la columna `barrio` text.

ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "barrio_id" integer;
--> statement-breakpoint

-- Backfill: matchear por nombre. Si alguna property tiene un barrio inexistente
-- en la tabla `barrios`, queda con barrio_id NULL (intencional, no rompe).
UPDATE "properties" p
   SET "barrio_id" = b."id"
  FROM "barrios" b
 WHERE p."barrio_id" IS NULL
   AND b."nombre" = p."barrio";
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE constraint_name = 'properties_barrio_id_barrios_id_fk'
       AND table_name = 'properties'
  ) THEN
    ALTER TABLE "properties"
      ADD CONSTRAINT "properties_barrio_id_barrios_id_fk"
      FOREIGN KEY ("barrio_id") REFERENCES "barrios"("id") ON DELETE SET NULL;
  END IF;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_properties_barrio_id" ON "properties" ("barrio_id");
