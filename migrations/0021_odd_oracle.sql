PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`program_id` text NOT NULL,
	`current_gate_id` text,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` integer,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`total_guesses` integer,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`current_gate_id`) REFERENCES `gates`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "session_status_check" CHECK("__new_session_progress"."status" IN ('in_progress', 'completed'))
);
--> statement-breakpoint
INSERT INTO `__new_session_progress`("id", "session_id", "program_id", "current_gate_id", "status", "started_at", "updated_at", "completed_at", "attempt_count", "total_guesses") SELECT "id", "session_id", "program_id", "current_gate_id", "status", "started_at", "updated_at", "completed_at", "attempt_count", "total_guesses" FROM `session_progress`;--> statement-breakpoint
DROP TABLE `session_progress`;--> statement-breakpoint
ALTER TABLE `__new_session_progress` RENAME TO `session_progress`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `session_progress_updated_at_idx` ON `session_progress` (`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_session_progress` ON `session_progress` (`session_id`,`program_id`);