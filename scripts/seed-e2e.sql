-- E2E Test Program — safe for concurrent runs
-- programs: INSERT OR IGNORE so multiple PRs don't clash
-- gates: INSERT OR REPLACE so seed changes take effect on re-run

INSERT OR IGNORE INTO programs (id, name, created_at)
VALUES (
  'e2e00000-0000-0000-0000-000000000001',
  'E2E Test Program',
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
);

INSERT OR REPLACE INTO gates (id, program_id, sequence_order, label, question, correct_answer, success_message, acceptance_threshold, guidance_enabled, guidance_threshold, created_at)
VALUES
  ('e2e00001-0000-0000-0000-000000000001', 'e2e00000-0000-0000-0000-000000000001', 1, 'Gate 1', 'What color is the sky?', 'blue', 'Correct! The sky is blue during a clear day.', 0.875, 1, 2, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  ('e2e00002-0000-0000-0000-000000000002', 'e2e00000-0000-0000-0000-000000000001', 2, 'Gate 2', 'What is 2 + 2?', '4', 'Correct! Basic arithmetic still holds.', 0.875, 0, 3, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  ('e2e00003-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000001', 3, 'Gate 3', 'What is the opposite of hot?', 'cold', 'Correct! Hot and cold are thermal opposites.', 0.875, 0, 3, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER));
