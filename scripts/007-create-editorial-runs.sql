-- Apply to a test database first. This does not activate the scheduler.
CREATE TABLE IF NOT EXISTS editorial_runs (
  id SERIAL PRIMARY KEY,
  publication_day DATE NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('morning', 'evening')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'published', 'skipped', 'failed')),
  lease_token UUID NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  story_key TEXT,
  source_url TEXT,
  error_code TEXT,
  UNIQUE (publication_day, slot)
);
CREATE UNIQUE INDEX IF NOT EXISTS editorial_runs_story_unique ON editorial_runs(story_key) WHERE status = 'published';
CREATE UNIQUE INDEX IF NOT EXISTS editorial_runs_source_unique ON editorial_runs(source_url) WHERE status = 'published';
