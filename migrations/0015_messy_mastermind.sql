CREATE TABLE `clue_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`session_progress_id` text NOT NULL,
	`requested_at` integer NOT NULL,
	FOREIGN KEY (`session_progress_id`) REFERENCES `session_progress`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `clue_rate_limits_session_progress_id_idx` ON `clue_rate_limits` (`session_progress_id`);