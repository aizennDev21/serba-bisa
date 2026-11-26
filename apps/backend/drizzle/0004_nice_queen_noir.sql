CREATE TABLE "user_admin_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_user_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"previous_status" "user_status",
	"new_status" "user_status",
	"role" "user_role",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_admin_audit_logs" ADD CONSTRAINT "user_admin_audit_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_admin_audit_logs" ADD CONSTRAINT "user_admin_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_admin_audit_logs_target_created_at_idx" ON "user_admin_audit_logs" USING btree ("target_user_id","created_at");--> statement-breakpoint
CREATE INDEX "user_admin_audit_logs_actor_created_at_idx" ON "user_admin_audit_logs" USING btree ("actor_id","created_at");