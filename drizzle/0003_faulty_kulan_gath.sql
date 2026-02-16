ALTER TABLE "chats" ADD COLUMN "assistant_name" varchar(50) DEFAULT 'claude' NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "user_name" varchar(50) DEFAULT 'human' NOT NULL;