CREATE TABLE "game_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"room_code" varchar(4) NOT NULL,
	"host_id" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"game_mode" text DEFAULT 'individual' NOT NULL,
	"max_players" integer DEFAULT 4 NOT NULL,
	"min_players" integer DEFAULT 2 NOT NULL,
	"winning_score" integer DEFAULT 50 NOT NULL,
	"use_timer" boolean DEFAULT true NOT NULL,
	"default_time_limit" integer DEFAULT 30 NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"game_state" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"pseudo" text NOT NULL,
	"auth_provider" text DEFAULT 'anonymous' NOT NULL,
	"email" text,
	"photo_url" text,
	"total_games" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"total_answers" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_caches" (
	"player_id" text PRIMARY KEY NOT NULL,
	"seen_questions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"category" text NOT NULL,
	"theme" text NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_players" (
	"room_id" text NOT NULL,
	"player_id" text NOT NULL,
	"pseudo" text NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"team_id" text,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"total_answers" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_players_room_id_player_id_pk" PRIMARY KEY("room_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "game_rooms" ADD CONSTRAINT "game_rooms_host_id_players_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_caches" ADD CONSTRAINT "question_caches_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_room_id_game_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."game_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_code_idx" ON "game_rooms" USING btree ("room_code","status");--> statement-breakpoint
CREATE INDEX "rooms_updated_at_idx" ON "game_rooms" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "questions_category_idx" ON "questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "questions_kind_idx" ON "questions" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "room_players_player_idx" ON "room_players" USING btree ("player_id");