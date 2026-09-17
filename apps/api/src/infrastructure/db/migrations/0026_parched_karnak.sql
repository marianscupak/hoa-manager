CREATE TYPE "public"."oidc_purpose" AS ENUM('LOGIN', 'LINK');--> statement-breakpoint
ALTER TABLE "oidc_login_attempts" ADD COLUMN "purpose" "oidc_purpose" DEFAULT 'LOGIN' NOT NULL;--> statement-breakpoint
ALTER TABLE "oidc_login_attempts" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "oidc_login_attempts" ADD CONSTRAINT "oidc_login_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;