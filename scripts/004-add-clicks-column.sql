-- Add clicks column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;

-- Create index for sorting by clicks
CREATE INDEX IF NOT EXISTS idx_posts_clicks ON posts(clicks DESC);
