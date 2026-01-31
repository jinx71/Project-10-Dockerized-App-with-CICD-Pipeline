CREATE TABLE IF NOT EXISTS instruments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  serial_number VARCHAR(60) UNIQUE NOT NULL,
  location VARCHAR(120) NOT NULL,
  calibration_interval_days INTEGER NOT NULL DEFAULT 365,
  last_calibrated_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
