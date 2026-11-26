CREATE TABLE "moderation_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"previous_status" "service_status",
	"new_status" "service_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "status_before_suspension" "service_status";--> statement-breakpoint
ALTER TABLE "moderation_audit_logs" ADD CONSTRAINT "moderation_audit_logs_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_audit_logs" ADD CONSTRAINT "moderation_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "moderation_audit_logs_service_created_at_idx" ON "moderation_audit_logs" USING btree ("service_id","created_at");--> statement-breakpoint
CREATE INDEX "moderation_audit_logs_actor_created_at_idx" ON "moderation_audit_logs" USING btree ("actor_id","created_at");