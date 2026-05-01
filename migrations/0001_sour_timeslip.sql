PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_gates` (
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
	`program_id` text NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_gates`("id", "label", "question", "correct_answer", "success_message", "is_solved", "solved_at", "attempt_count", "acceptance_threshold", "guidance_enabled", "guidance_prompt", "guidance_threshold", "program_id") SELECT "id", "label", "question", "correct_answer", "success_message", "is_solved", "solved_at", "attempt_count", "acceptance_threshold", "guidance_enabled", "guidance_prompt", "guidance_threshold", "program_id" FROM `gates`;--> statement-breakpoint
DROP TABLE `gates`;--> statement-breakpoint
ALTER TABLE `__new_gates` RENAME TO `gates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_game_state` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_game_state`("id") SELECT "id" FROM `game_state`;--> statement-breakpoint
DROP TABLE `game_state`;--> statement-breakpoint
ALTER TABLE `__new_game_state` RENAME TO `game_state`;