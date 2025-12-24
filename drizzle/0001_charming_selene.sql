CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "role" "message_role" NOT NULL;