CREATE INDEX `session_completed_gates_gate_id_idx` ON `session_completed_gates` (`gate_id`);--> statement-breakpoint
CREATE INDEX `session_progress_program_id_idx` ON `session_progress` (`program_id`);--> statement-breakpoint
CREATE INDEX `session_progress_current_gate_id_idx` ON `session_progress` (`current_gate_id`);