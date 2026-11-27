CREATE TABLE "records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(16) NOT NULL,
	"score_meters" integer NOT NULL,
	"saved_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "records_score_saved_idx" ON "records" USING btree ("score_meters" desc,"saved_at" asc);