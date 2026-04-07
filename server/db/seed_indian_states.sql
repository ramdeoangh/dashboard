-- Indian states and union territories (idempotent on code)
SET NAMES utf8mb4;

INSERT INTO states (name, code, is_active, sort_order) VALUES
  ('Andhra Pradesh', 'AP', 1, 1),
  ('Arunachal Pradesh', 'AR', 1, 2),
  ('Assam', 'AS', 1, 3),
  ('Bihar', 'BR', 1, 4),
  ('Chhattisgarh', 'CG', 1, 5),
  ('Goa', 'GA', 1, 6),
  ('Gujarat', 'GJ', 1, 7),
  ('Haryana', 'HR', 1, 8),
  ('Himachal Pradesh', 'HP', 1, 9),
  ('Jharkhand', 'JH', 1, 10),
  ('Karnataka', 'KA', 1, 11),
  ('Kerala', 'KL', 1, 12),
  ('Madhya Pradesh', 'MP', 1, 13),
  ('Maharashtra', 'MH', 1, 14),
  ('Manipur', 'MN', 1, 15),
  ('Meghalaya', 'ML', 1, 16),
  ('Mizoram', 'MZ', 1, 17),
  ('Nagaland', 'NL', 1, 18),
  ('Odisha', 'OR', 1, 19),
  ('Punjab', 'PB', 1, 20),
  ('Rajasthan', 'RJ', 1, 21),
  ('Sikkim', 'SK', 1, 22),
  ('Tamil Nadu', 'TN', 1, 23),
  ('Telangana', 'TS', 1, 24),
  ('Tripura', 'TR', 1, 25),
  ('Uttar Pradesh', 'UP', 1, 26),
  ('Uttarakhand', 'UK', 1, 27),
  ('West Bengal', 'WB', 1, 28),
  ('Andaman and Nicobar Islands', 'AN', 1, 29),
  ('Chandigarh', 'CH', 1, 30),
  ('Dadra and Nagar Haveli and Daman and Diu', 'DN', 1, 31),
  ('Delhi', 'DL', 1, 32),
  ('Jammu and Kashmir', 'JK', 1, 33),
  ('Ladakh', 'LA', 1, 34),
  ('Lakshadweep', 'LD', 1, 35),
  ('Puducherry', 'PY', 1, 36)
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active), sort_order = VALUES(sort_order);

INSERT INTO locations (state_id, name, code, is_active, sort_order)
SELECT s.id, 'Mumbai PAX', 'MH-MUM-PAX', 1, 1 FROM states s WHERE s.code = 'MH' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active), sort_order = VALUES(sort_order);

INSERT INTO locations (state_id, name, code, is_active, sort_order)
SELECT s.id, 'Pune PAX', 'MH-PUN-PAX', 1, 2 FROM states s WHERE s.code = 'MH' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active), sort_order = VALUES(sort_order);

INSERT INTO locations (state_id, name, code, is_active, sort_order)
SELECT s.id, 'Bengaluru PAX', 'KA-BLR-PAX', 1, 1 FROM states s WHERE s.code = 'KA' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active), sort_order = VALUES(sort_order);
