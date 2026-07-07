CREATE TABLE `attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`response_json` text,
	`correct` integer NOT NULL,
	`used_hint` integer DEFAULT false NOT NULL,
	`ms_used` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attempts_user_exercise_idx` ON `attempts` (`user_id`,`exercise_id`);--> statement-breakpoint
CREATE INDEX `attempts_user_time_idx` ON `attempts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `daily_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`items_json` text NOT NULL,
	`done_json` text DEFAULT '[]' NOT NULL,
	`minutes_actual` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_plans_user_date_uq` ON `daily_plans` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `dictation_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`material_id` integer NOT NULL,
	`seg_idx` integer NOT NULL,
	`answer` text NOT NULL,
	`diff_json` text NOT NULL,
	`score` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `dictation_user_material_idx` ON `dictation_logs` (`user_id`,`material_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`meta_json` text,
	`ts` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_user_ts_idx` ON `events` (`user_id`,`ts`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`gp_id` integer,
	`phoneme` text,
	`type` text NOT NULL,
	`payload_json` text NOT NULL,
	`answer_json` text NOT NULL,
	`explain_zh` text,
	`difficulty` integer DEFAULT 1 NOT NULL,
	`source` text,
	FOREIGN KEY (`gp_id`) REFERENCES `grammar_points`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_uid_unique` ON `exercises` (`uid`);--> statement-breakpoint
CREATE INDEX `exercises_gp_idx` ON `exercises` (`gp_id`);--> statement-breakpoint
CREATE TABLE `grammar_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stage` integer NOT NULL,
	`ord` integer NOT NULL,
	`code` text NOT NULL,
	`title_zh` text NOT NULL,
	`explain_md` text NOT NULL,
	`pitfalls_md` text,
	`prereq_codes` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grammar_points_code_unique` ON `grammar_points` (`code`);--> statement-breakpoint
CREATE TABLE `llm_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`payload_json` text NOT NULL,
	`provider` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`result_json` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`done_at` integer
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`level` integer NOT NULL,
	`audio_path` text NOT NULL,
	`transcript_json` text NOT NULL,
	`duration_s` integer,
	`word_count` integer,
	`published_at` text
);
--> statement-breakpoint
CREATE TABLE `productions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`prompt` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`review_json` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recordings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ref_type` text NOT NULL,
	`ref_id` text NOT NULL,
	`audio_path` text NOT NULL,
	`transcript` text,
	`intelligibility` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sentences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`en` text NOT NULL,
	`zh` text NOT NULL,
	`tokens_json` text NOT NULL,
	`alt_json` text,
	`audio_path` text,
	`gp_codes` text DEFAULT '[]' NOT NULL,
	`pack_id` text,
	`level` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sentences_uid_unique` ON `sentences` (`uid`);--> statement-breakpoint
CREATE INDEX `sentences_pack_idx` ON `sentences` (`pack_id`);--> statement-breakpoint
CREATE TABLE `srs_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ref_type` text NOT NULL,
	`ref_id` text NOT NULL,
	`ef` real DEFAULT 2.5 NOT NULL,
	`interval_d` integer DEFAULT 0 NOT NULL,
	`due` text NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `srs_user_ref_uq` ON `srs_cards` (`user_id`,`ref_type`,`ref_id`);--> statement-breakpoint
CREATE INDEX `srs_user_due_idx` ON `srs_cards` (`user_id`,`due`);--> statement-breakpoint
CREATE TABLE `tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`answers_json` text,
	`scores_json` text,
	`report_md` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`pw_hash` text NOT NULL,
	`role` text NOT NULL,
	`settings_json` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_name_unique` ON `users` (`name`);--> statement-breakpoint
CREATE TABLE `wordbook` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`word` text NOT NULL,
	`source_ref` text,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wordbook_user_word_uq` ON `wordbook` (`user_id`,`word`);