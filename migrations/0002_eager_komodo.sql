ALTER TABLE `game_state` ADD `last_updated` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `gates` ADD `sequence_order` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `gates` ADD `created_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `created_at` integer NOT NULL;