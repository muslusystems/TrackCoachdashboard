-- Koç kredi ekranı için ek sütunlar (bir kez çalıştır)
alter table credit_ledger add column if not exists student_id uuid references students(id);
alter table credit_ledger add column if not exists prev_license_end date;
alter table credit_ledger add column if not exists prev_plan_questions int;
alter table credit_ledger add column if not exists reverted_at timestamptz;
create index if not exists credit_ledger_student_idx on credit_ledger(student_id);
