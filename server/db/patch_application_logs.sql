-- Add application_logs for existing databases (safe to run multiple times)
CREATE TABLE IF NOT EXISTS application_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  correlation_id CHAR(36) NULL,
  level VARCHAR(20) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  meta JSON NULL,
  method VARCHAR(12) NULL,
  path VARCHAR(500) NULL,
  status_code SMALLINT UNSIGNED NULL,
  duration_ms INT UNSIGNED NULL,
  user_id INT UNSIGNED NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_app_logs_created (created_at),
  KEY idx_app_logs_level (level),
  KEY idx_app_logs_correlation (correlation_id),
  KEY idx_app_logs_user (user_id),
  CONSTRAINT fk_app_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
