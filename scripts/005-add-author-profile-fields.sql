-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update existing admin with profile info
UPDATE users
SET name = 'Lucas Ferreira',
    bio = 'Founder and editor-in-chief of Fronteira Geek. Passionate about anime, gaming, and all things geek culture.',
    avatar_url = NULL
WHERE email = 'admin@fronteirageek.com';

-- Insert second admin account (password: editor123)
INSERT INTO users (email, password, name, role, bio, avatar_url) VALUES
  ('editor@fronteirageek.com', 'editor123', 'Ana Santos', 'ADMIN', 'Senior editor at Fronteira Geek covering Marvel, DC, Star Wars, and tech. Lifelong comic book fan and sci-fi enthusiast.', NULL)
ON CONFLICT (email) DO NOTHING;
