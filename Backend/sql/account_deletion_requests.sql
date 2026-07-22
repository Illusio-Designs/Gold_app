-- Account deletion requests submitted from the public website /delete form.
-- Run this once against the app database to create the table.

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) DEFAULT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  status ENUM('pending', 'processed', 'rejected') NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
