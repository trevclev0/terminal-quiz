CREATE TABLE `session_completed_gates` (
	`id` text PRIMARY KEY NOT NULL,
	`session_progress_id` text NOT NULL,
	`gate_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`session_progress_id`) REFERENCES `session_progress`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gate_id`) REFERENCES `gates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_session_gate_completion` ON `session_completed_gates` (`session_progress_id`,`gate_id`);--> statement-breakpoint
-- Extract existing completed_gate_ids JSON data into session_completed_gates
-- before the column is dropped in the table rebuild below.
INSERT INTO `session_completed_gates` (`id`, `session_progress_id`, `gate_id`, `completed_at`)
  SELECT lower(hex(randomblob(16))), `sp`.`id`, `je`.`value`, `sp`.`updated_at`
  FROM `session_progress` `sp`, json_each(`sp`.`completed_gate_ids`) AS `je`
  WHERE `sp`.`completed_gate_ids` IS NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`program_id` text NOT NULL,
	`current_gate_id` text,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`current_gate_id`) REFERENCES `gates`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "session_status_check" CHECK("__new_session_progress"."status" IN ('in_progress', 'completed'))
);
--> statement-breakpoint
INSERT INTO `__new_session_progress`("id", "session_id", "program_id", "current_gate_id", "status", "started_at", "updated_at", "completed_at", "attempt_count") SELECT "id", "session_id", "program_id", "current_gate_id", "status", "started_at", "updated_at", "completed_at", "attempt_count" FROM `session_progress`;--> statement-breakpoint
DROP TABLE `session_progress`;--> statement-breakpoint
ALTER TABLE `__new_session_progress` RENAME TO `session_progress`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_session_progress` ON `session_progress` (`session_id`,`program_id`);
