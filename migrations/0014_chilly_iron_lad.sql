PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_programs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`author_id` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`created_at` integer DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "program_visibility_check" CHECK("__new_programs"."visibility" IN ('public', 'unlisted'))
);
--> statement-breakpoint
INSERT INTO `__new_programs`("id", "name", "author_id", "visibility", "created_at") SELECT "id", "name", NULL, 'public', "created_at" FROM `programs`;--> statement-breakpoint
DROP TABLE `programs`;--> statement-breakpoint
ALTER TABLE `__new_programs` RENAME TO `programs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;