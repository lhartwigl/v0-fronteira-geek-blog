CREATE TABLE IF NOT EXISTS traffic_daily (
  day DATE NOT NULL,
  source TEXT NOT NULL,
  views BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (day, source)
);
