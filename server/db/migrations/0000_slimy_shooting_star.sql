CREATE TYPE "public"."garantia" AS ENUM('requerida', 'sin', 'ambas');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('admin', 'inmobiliaria', 'usuario');--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"subtitulo" text,
	"color" text DEFAULT 'brand',
	"link" text,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barrios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"ciudad_id" integer NOT NULL,
	"x" real NOT NULL,
	"y" real NOT NULL,
	"precio_mes_anterior" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ciudades" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"provincia" text DEFAULT 'Córdoba' NOT NULL,
	"slug" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ciudades_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "profesionales" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"rol" text NOT NULL,
	"matricula" text,
	"rating" real DEFAULT 5,
	"iniciales" text NOT NULL,
	"color" text DEFAULT 'brand',
	"telefono" text,
	"email" text
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ciudad_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"tipo" text NOT NULL,
	"direccion" text NOT NULL,
	"barrio" text NOT NULL,
	"precio" integer NOT NULL,
	"precio_anterior" integer,
	"ambientes" integer DEFAULT 1 NOT NULL,
	"banos" integer DEFAULT 1 NOT NULL,
	"superficie" integer DEFAULT 0 NOT NULL,
	"garantia" "garantia" DEFAULT 'requerida' NOT NULL,
	"mascotas" boolean DEFAULT false NOT NULL,
	"amoblado" boolean DEFAULT false NOT NULL,
	"expensas_incluidas" boolean DEFAULT false NOT NULL,
	"destacado" boolean DEFAULT false NOT NULL,
	"liquidacion" boolean DEFAULT false NOT NULL,
	"descripcion" text,
	"imagen" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"rol" "rol" DEFAULT 'usuario' NOT NULL,
	"empresa" text,
	"telefono" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "barrios" ADD CONSTRAINT "barrios_ciudad_id_ciudades_id_fk" FOREIGN KEY ("ciudad_id") REFERENCES "public"."ciudades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_ciudad_id_ciudades_id_fk" FOREIGN KEY ("ciudad_id") REFERENCES "public"."ciudades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_properties_ciudad_id" ON "properties" USING btree ("ciudad_id");--> statement-breakpoint
CREATE INDEX "idx_properties_tipo" ON "properties" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "idx_properties_barrio" ON "properties" USING btree ("barrio");--> statement-breakpoint
CREATE INDEX "idx_properties_precio" ON "properties" USING btree ("precio");--> statement-breakpoint
CREATE INDEX "idx_properties_created_at" ON "properties" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_properties_user_id" ON "properties" USING btree ("user_id");