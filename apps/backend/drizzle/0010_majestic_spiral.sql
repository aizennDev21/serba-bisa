CREATE TABLE "owner_availability_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"service_date" date NOT NULL,
	"is_available" boolean NOT NULL,
	"start_minute" integer DEFAULT 480 NOT NULL,
	"end_minute" integer DEFAULT 1020 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "owner_availability_exceptions_start_minute_check" CHECK ("owner_availability_exceptions"."start_minute" between 0 and 1380 and "owner_availability_exceptions"."start_minute" % 60 = 0),
	CONSTRAINT "owner_availability_exceptions_end_minute_check" CHECK ("owner_availability_exceptions"."end_minute" between 60 and 1440 and "owner_availability_exceptions"."end_minute" % 60 = 0),
	CONSTRAINT "owner_availability_exceptions_interval_check" CHECK (not "owner_availability_exceptions"."is_available" or "owner_availability_exceptions"."end_minute" > "owner_availability_exceptions"."start_minute")
);
--> statement-breakpoint
ALTER TABLE "owner_availability_exceptions" ADD CONSTRAINT "owner_availability_exceptions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "owner_availability_exceptions_owner_date_unique_idx" ON "owner_availability_exceptions" USING btree ("owner_id","service_date");--> statement-breakpoint
CREATE INDEX "owner_availability_exceptions_date_idx" ON "owner_availability_exceptions" USING btree ("service_date");