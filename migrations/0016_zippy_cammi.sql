ALTER TABLE `clue_rate_limits` ADD `gate_id` text;--> statement-breakpoint
ALTER TABLE `clue_rate_limits` ADD `attempt_count_at_request` integer;