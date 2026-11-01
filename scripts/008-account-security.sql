-- Additive change. Apply before deploying the account-management release.
-- Does not modify existing passwords, roles, posts, or accounts.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 1,
  resets_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_rate_limits_expiry ON auth_rate_limits(resets_at);
