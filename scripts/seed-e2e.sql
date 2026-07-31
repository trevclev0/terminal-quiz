-- E2E Test Program — safe for concurrent runs
-- programs: INSERT OR IGNORE so multiple PRs don't clash
-- gates: ON CONFLICT DO UPDATE so seed changes apply without FK cascade

-- Test user for auth bypass (x-auth-test-user-id=e2e-test-user)
-- ID must match TEST_USER_ID in src/worker/test-utils/testConstants.ts
INSERT OR IGNORE INTO user (id, name, email, email_verified, created_at, updated_at)
VALUES (
  'e2e-test-user',
  'e2e-test-user',
  'e2e-test-user@test.example.com',
  1,
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER),
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
);

INSERT OR IGNORE INTO programs (id, name, created_at)
VALUES (
  'e2e00000-0000-0000-0000-000000000001',
  'E2E Test Program',
  CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
);

INSERT INTO gates (id, program_id, sequence_order, label, question, correct_answer, success_message, acceptance_threshold, guidance_enabled, guidance_threshold, created_at)
VALUES
  ('e2e00001-0000-0000-0000-000000000001', 'e2e00000-0000-0000-0000-000000000001', 1, 'Gate 1', 'What color is the sky?', 'blue', 'Correct! The sky is blue during a clear day.', 0.875, 1, 2, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  ('e2e00002-0000-0000-0000-000000000002', 'e2e00000-0000-0000-0000-000000000001', 2, 'Gate 2', 'What is 2 + 2?', '4', 'Correct! Basic arithmetic still holds.', 0.875, 0, 3, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  ('e2e00003-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000001', 3, 'Gate 3', 'What is the opposite of hot?', 'cold', 'Correct! Hot and cold are thermal opposites.', 0.875, 0, 3, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
ON CONFLICT(id) DO UPDATE SET
  program_id = excluded.program_id,
  sequence_order = excluded.sequence_order,
  label = excluded.label,
  question = excluded.question,
  correct_answer = excluded.correct_answer,
  success_message = excluded.success_message,
  acceptance_threshold = excluded.acceptance_threshold,
  guidance_enabled = excluded.guidance_enabled,
  guidance_threshold = excluded.guidance_threshold;
-- NOTE: created_at intentionally omitted — preserve original timestamp
