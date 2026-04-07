-- Replace free-text duration with start/end dates and start_year (from start_date).
ALTER TABLE projects
  ADD COLUMN start_date DATE NULL AFTER contact_number,
  ADD COLUMN end_date DATE NULL AFTER start_date,
  ADD COLUMN start_year SMALLINT UNSIGNED NULL COMMENT 'Year of start_date; set on write' AFTER end_date;

UPDATE projects SET start_year = YEAR(start_date) WHERE start_date IS NOT NULL;

ALTER TABLE projects DROP COLUMN duration_completion;
