CREATE TYPE "public"."review_status" AS ENUM('published', 'hidden', 'removed');--> statement-breakpoint
CREATE TYPE "public"."service_price_unit" AS ENUM('hour', 'visit', 'project', 'session', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."service_status" AS ENUM('draft', 'active', 'unavailable', 'suspended', 'archived');--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"status" "review_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range_check" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"price" integer NOT NULL,
	"price_unit" "service_price_unit" NOT NULL,
	"status" "service_status" DEFAULT 'draft' NOT NULL,
	"location" text NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_coordinates_pair_check" CHECK (("services"."latitude" is null) = ("services"."longitude" is null)),
	CONSTRAINT "services_latitude_range_check" CHECK ("services"."latitude" is null or "services"."latitude" between -90 and 90),
	CONSTRAINT "services_longitude_range_check" CHECK ("services"."longitude" is null or "services"."longitude" between -180 and 180),
	CONSTRAINT "services_price_nonnegative_check" CHECK ("services"."price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_service_status_created_at_idx" ON "reviews" USING btree ("service_id","status","created_at");--> statement-breakpoint
CREATE INDEX "services_status_created_at_idx" ON "services" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "services_category_idx" ON "services" USING btree ("category");--> statement-breakpoint
CREATE INDEX "services_owner_id_idx" ON "services" USING btree ("owner_id");