PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_gate_clues` (
	`id` text PRIMARY KEY NOT NULL,
	`session_progress_id` text NOT NULL,
	`gate_id` text NOT NULL,
	`clue_text` text NOT NULL,
	`attempt_count_at_request` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`session_progress_id`) REFERENCES `session_progress`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gate_id`) REFERENCES `gates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_gate_clues`("id", "session_progress_id", "gate_id", "clue_text", "attempt_count_at_request", "created_at") SELECT "id", "session_progress_id", "gate_id", "clue_text", "attempt_count_at_request", "created_at" FROM `gate_clues`;--> statement-breakpoint
DROP TABLE `gate_clues`;--> statement-breakpoint
ALTER TABLE `__new_gate_clues` RENAME TO `gate_clues`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `gate_clues_session_progress_id_idx` ON `gate_clues` (`session_progress_id`);--> statement-breakpoint
CREATE INDEX `gate_clues_gate_id_idx` ON `gate_clues` (`gate_id`);