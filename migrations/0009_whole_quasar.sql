DROP TABLE `game_state`;--> statement-breakpoint
ALTER TABLE `gates` DROP COLUMN `is_solved`;--> statement-breakpoint
ALTER TABLE `gates` DROP COLUMN `solved_at`;--> statement-breakpoint
ALTER TABLE `gates` DROP COLUMN `attempt_count`;--> statement-breakpoint
ALTER TABLE `gates` DROP COLUMN `guidance_prompt`;--> statement-breakpoint
ALTER TABLE `programs` DROP COLUMN `is_selected`;--> statement-breakpoint
ALTER TABLE `programs` DROP COLUMN `selected_at`;--> statement-breakpoint
ALTER TABLE `programs` DROP COLUMN `completed_at`;