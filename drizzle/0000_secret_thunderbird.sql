CREATE TABLE `game_state` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gates` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`question` text NOT NULL,
	`correct_answer` text NOT NULL,
	`success_message` text NOT NULL,
	`is_solved` integer DEFAULT false NOT NULL,
	`solved_at` integer,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`acceptance_threshold` real DEFAULT 0.875 NOT NULL,
	`guidance_enabled` integer DEFAULT false NOT NULL,
	`guidance_prompt` text,
	`guidance_threshold` integer DEFAULT 2 NOT NULL,
	`program_id` text,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_selected` integer DEFAULT false NOT NULL,
	`selected_at` integer,
	`completed_at` integer
);
