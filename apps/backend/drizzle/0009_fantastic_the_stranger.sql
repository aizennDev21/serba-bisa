CREATE TABLE "owner_weekly_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"start_minute" integer DEFAULT 480 NOT NULL,
	"end_minute" integer DEFAULT 1020 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "owner_weekly_availability_day_range_check" CHECK ("owner_weekly_availability"."day_of_week" between 0 and 6),
	CONSTRAINT "owner_weekly_availability_start_minute_check" CHECK ("owner_weekly_availability"."start_minute" between 0 and 1380 and "owner_weekly_availability"."start_minute" % 60 = 0),
	CONSTRAINT "owner_weekly_availability_end_minute_check" CHECK ("owner_weekly_availability"."end_minute" between 60 and 1440 and "owner_weekly_availability"."end_minute" % 60 = 0),
	CONSTRAINT "owner_weekly_availability_interval_check" CHECK (not "owner_weekly_availability"."is_available" or "owner_weekly_availability"."end_minute" > "owner_weekly_availability"."start_minute")
);
--> statement-breakpoint
ALTER TABLE "owner_weekly_availability" ADD CONSTRAINT "owner_weekly_availability_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "owner_weekly_availability_owner_day_unique_idx" ON "owner_weekly_availability" USING btree ("owner_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_owner_accepted_slot_unique_idx" ON "bookings" USING btree ("owner_id","requested_at") WHERE "bookings"."status" = 'accepted' and "bookings"."requested_at" is not null;