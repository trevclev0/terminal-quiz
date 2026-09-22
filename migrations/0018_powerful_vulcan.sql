CREATE TABLE `error_beacon_limits` (
	`bucket_key` text NOT NULL,
	`window_start` integer NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`bucket_key`, `window_start`)
);
--> statement-breakpoint
CREATE INDEX `error_beacon_limits_expires_at_idx` ON `error_beacon_limits` (`expires_at`);