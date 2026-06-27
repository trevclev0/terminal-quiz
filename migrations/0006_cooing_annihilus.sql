CREATE TABLE `gate_clues` (
	`id` text PRIMARY KEY NOT NULL,
	`session_progress_id` text NOT NULL,
	`gate_id` text NOT NULL,
	`clue_text` text NOT NULL,
	`attempt_count_at_request` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_progress_id`) REFERENCES `session_progress`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gate_id`) REFERENCES `gates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `session_progress` ADD `attempt_count` integer DEFAULT 0 NOT NULL;