CREATE TABLE "oidc_login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "provider" NOT NULL,
	"state_hash" text NOT NULL,
	"nonce_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oidc_login_attempts_state_hash_unique" UNIQUE("state_hash")
);
--> statement-breakpoint
CREATE TABLE "auth_exchange_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"membership_id" uuid,
	"roles" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_exchange_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
ALTER TABLE "auth_exchange_codes" ADD CONSTRAINT "auth_exchange_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_exchange_codes" ADD CONSTRAINT "auth_exchange_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_exchange_codes" ADD CONSTRAINT "auth_exchange_codes_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE cascade ON UPDATE no action;