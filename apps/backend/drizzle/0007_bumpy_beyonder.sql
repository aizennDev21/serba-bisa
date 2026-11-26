CREATE TYPE "public"."booking_status" AS ENUM('requested', 'accepted', 'declined', 'cancelled', 'completed');--> statement-breakpoint
CREATE TABLE "booking_status_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"previous_status" "booking_status" NOT NULL,
	"new_status" "booking_status" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"seeker_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"service_title" text NOT NULL,
	"price" integer NOT NULL,
	"price_unit" "service_price_unit" NOT NULL,
	"request_message" text NOT NULL,
	"requested_at" timestamp with time zone,
	"requested_location" text,
	"status" "booking_status" DEFAULT 'requested' NOT NULL,
	"status_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_price_nonnegative_check" CHECK ("bookings"."price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "booking_status_audit_logs" ADD CONSTRAINT "booking_status_audit_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_audit_logs" ADD CONSTRAINT "booking_status_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_seeker_id_users_id_fk" FOREIGN KEY ("seeker_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_status_audit_logs_booking_created_at_idx" ON "booking_status_audit_logs" USING btree ("booking_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_seeker_created_at_idx" ON "bookings" USING btree ("seeker_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_owner_created_at_idx" ON "bookings" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_service_status_idx" ON "bookings" USING btree ("service_id","status");