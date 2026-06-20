CREATE TABLE `session_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`program_id` text NOT NULL,
	`current_gate_id` text,
	`completed_gate_ids` text DEFAULT '[]',
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`current_gate_id`) REFERENCES `gates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_session_progress` ON `session_progress` (`session_id`,`program_id`);