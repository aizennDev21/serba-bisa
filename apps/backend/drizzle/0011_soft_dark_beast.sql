ALTER TABLE "owner_weekly_availability" DROP CONSTRAINT "owner_weekly_availability_interval_check";--> statement-breakpoint
DELETE FROM "owner_weekly_availability" WHERE "is_available" = false;--> statement-breakpoint
DROP INDEX "owner_weekly_availability_owner_day_unique_idx";--> statement-breakpoint
DROP INDEX "owner_availability_exceptions_owner_date_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "owner_weekly_availability_owner_day_start_unique_idx" ON "owner_weekly_availability" USING btree ("owner_id","day_of_week","start_minute");--> statement-breakpoint
CREATE UNIQUE INDEX "owner_availability_exceptions_owner_date_unique_idx" ON "owner_availability_exceptions" USING btree ("owner_id","service_date","start_minute");--> statement-breakpoint
ALTER TABLE "owner_weekly_availability" DROP COLUMN "is_available";--> statement-breakpoint
ALTER TABLE "owner_weekly_availability" ADD CONSTRAINT "owner_weekly_availability_interval_check" CHECK ("owner_weekly_availability"."end_minute" > "owner_weekly_availability"."start_minute");