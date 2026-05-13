CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"module" text NOT NULL,
	"event_type" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_user_id" uuid,
	"actor_membership_id" uuid,
	"aggregate_type" text,
	"aggregate_id" uuid,
	"entity_type" text,
	"entity_id" uuid,
	"visibility" text NOT NULL,
	"payload" jsonb NOT NULL,
	"correlation_id" text,
	"ip_address" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE INDEX "idx_audit_events_tenant_occurred" ON "audit_events" USING btree ("tenant_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_audit_events_aggregate" ON "audit_events" USING btree ("tenant_id","aggregate_type","aggregate_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_audit_events_actor_user" ON "audit_events" USING btree ("tenant_id","actor_user_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_audit_events_event_type" ON "audit_events" USING btree ("event_type","occurred_at" DESC NULLS LAST);--> statement-breakpoint

CREATE OR REPLACE FUNCTION audit_events_block_mutation()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only; % is not allowed', TG_OP;
END;
$$;--> statement-breakpoint

CREATE TRIGGER audit_events_block_update
  BEFORE UPDATE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION audit_events_block_mutation();--> statement-breakpoint

CREATE TRIGGER audit_events_block_delete
  BEFORE DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION audit_events_block_mutation();--> statement-breakpoint

CREATE TRIGGER audit_events_block_truncate
  BEFORE TRUNCATE ON audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION audit_events_block_mutation();