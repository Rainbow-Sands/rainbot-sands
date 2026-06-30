DROP TABLE "session_recaps" CASCADE;--> statement-breakpoint
DROP TABLE "session_transcripts" CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "transcript" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "recap" text;