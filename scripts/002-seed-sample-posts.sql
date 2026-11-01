-- No default administrator accounts are created.
-- User creation is handled by protected setup and the Team panel; no default credentials.

-- Insert sample featured post
INSERT INTO posts (title, slug, content, excerpt, category_id, featured, status, reading_time, meta_description, tags, author_id)
VALUES (
  'Welcome to Fronteira Geek - Your Ultimate Geek News Destination',
  'welcome-to-fronteira-geek',
  '<h2>Welcome to the Frontier of Geek Culture</h2>
<p>We are thrilled to launch <strong>Fronteira Geek</strong>, your new go-to destination for all things geek culture. From the latest anime releases to groundbreaking video game announcements, from the ever-expanding Marvel Cinematic Universe to the galaxy far, far away of Star Wars - we have got you covered.</p>

<h2>What We Cover</h2>
<p>Our team of passionate geek journalists brings you daily coverage across all the major pillars of geek culture:</p>

<h3>Anime & Manga</h3>
<p>Stay up to date with the latest anime seasons, manga chapter reviews, and industry news. Whether you are a fan of shonen action or slice-of-life dramas, we have something for everyone.</p>

<h3>Gaming</h3>
<p>From AAA blockbusters to indie gems, we cover game reviews, industry analysis, esports updates, and exclusive previews of upcoming titles.</p>

<h3>Comics & Superheroes</h3>
<p>Marvel, DC, and beyond - get the latest on comic book releases, movie and TV show updates, and deep dives into your favorite superhero lore.</p>

<h3>Tech & Innovation</h3>
<p>The technology that powers our geeky passions. From next-gen consoles to VR breakthroughs, AI advancements to the latest gadgets - we explore it all.</p>

<blockquote>The frontier of geek culture is vast and ever-expanding. Join us as we explore every corner of it.</blockquote>

<p>Stay tuned for daily updates, in-depth features, and exclusive content. Welcome to the frontier!</p>',
  'Introducing Fronteira Geek - your new destination for anime, games, Marvel, DC, Star Wars, RPG, and tech news.',
  (SELECT id FROM categories WHERE slug = 'trending'),
  true,
  'published',
  4,
  'Fronteira Geek is your ultimate destination for geek news covering anime, games, Marvel, DC, Star Wars, RPG, and tech.',
  ARRAY['welcome', 'announcement', 'geek culture', 'news'],
  (SELECT id FROM users WHERE email = 'admin@fronteirageek.com')
)
ON CONFLICT (slug) DO NOTHING;

-- Insert more sample posts
INSERT INTO posts (title, slug, content, excerpt, category_id, featured, status, reading_time, meta_description, tags, author_id)
VALUES
(
  'Top 10 Anime to Watch This Season - Winter 2026 Guide',
  'top-10-anime-winter-2026',
  '<h2>The Best Anime of Winter 2026</h2>
<p>Winter 2026 has arrived with a spectacular lineup of anime that caters to every taste. From action-packed shonen series to heartfelt romances, this season has something special for everyone.</p>

<h3>1. Dragon''s Legacy: Final Arc</h3>
<p>The long-running saga reaches its epic conclusion with stunning animation quality and emotionally charged storytelling that will leave fans in tears.</p>

<h3>2. Cyber Samurai Chronicles</h3>
<p>A fresh take on the cyberpunk genre mixed with traditional samurai themes. The world-building is phenomenal and the action sequences are breathtaking.</p>

<p>These are just the tip of the iceberg. Check back for our full reviews as each series progresses through the season.</p>',
  'Our curated guide to the best anime premiering this winter season.',
  (SELECT id FROM categories WHERE slug = 'anime'),
  false,
  'published',
  3,
  'Discover the top 10 must-watch anime series of Winter 2026 season.',
  ARRAY['anime', 'seasonal guide', 'winter 2026', 'recommendations'],
  (SELECT id FROM users WHERE email = 'admin@fronteirageek.com')
),
(
  'Marvel Phase 7: Everything We Know So Far',
  'marvel-phase-7-everything-we-know',
  '<h2>The Next Chapter of the MCU</h2>
<p>Marvel Studios has officially unveiled its ambitious plans for Phase 7, and fans have every reason to be excited. With new heroes, returning favorites, and multiverse-shattering events on the horizon, the MCU shows no signs of slowing down.</p>

<h3>New Heroes Join the Roster</h3>
<p>Phase 7 introduces several new characters from the comics, including fan-favorite heroes that fans have been requesting for years.</p>

<h3>The Multiverse Saga Concludes</h3>
<p>After years of build-up, the multiverse storyline reaches its epic conclusion with unprecedented crossover events that will redefine the MCU as we know it.</p>

<p>Stay tuned for our in-depth coverage as more details are revealed at upcoming Marvel events.</p>',
  'Everything revealed about Marvel Phase 7 - new heroes, returning favorites, and more.',
  (SELECT id FROM categories WHERE slug = 'marvel'),
  false,
  'published',
  3,
  'Complete guide to Marvel Phase 7 announcements, new heroes, and upcoming MCU films.',
  ARRAY['marvel', 'mcu', 'phase 7', 'movies', 'superheroes'],
  (SELECT id FROM users WHERE email = 'admin@fronteirageek.com')
),
(
  'The Most Anticipated Games of 2026',
  'most-anticipated-games-2026',
  '<h2>2026: A Landmark Year for Gaming</h2>
<p>The gaming industry is gearing up for what could be one of the most exciting years in recent memory. With major releases spanning every genre and platform, 2026 promises to deliver unforgettable gaming experiences.</p>

<h3>Open World Adventures</h3>
<p>Several studios are pushing the boundaries of open-world design with new titles that promise unprecedented scale and interactivity.</p>

<h3>The Rise of AI in Gaming</h3>
<p>AI-driven NPCs and dynamic storytelling are becoming the new standard, with several 2026 titles showcasing revolutionary AI technology.</p>

<p>From RPGs to shooters, strategy games to platformers, 2026 has something for every type of gamer.</p>',
  'The biggest and most exciting game releases coming in 2026.',
  (SELECT id FROM categories WHERE slug = 'games'),
  false,
  'published',
  3,
  'Preview the most anticipated video game releases of 2026 across all platforms.',
  ARRAY['gaming', '2026', 'preview', 'upcoming releases'],
  (SELECT id FROM users WHERE email = 'admin@fronteirageek.com')
),
(
  'Star Wars: New Series Expands the High Republic Era',
  'star-wars-high-republic-new-series',
  '<h2>Exploring the Golden Age of the Jedi</h2>
<p>Lucasfilm continues to expand the High Republic era with a brand new animated series that promises to deepen our understanding of the Jedi Order at the height of its power.</p>

<h3>A New Generation of Jedi</h3>
<p>The series introduces a diverse cast of new Jedi characters, each with unique abilities and compelling backstories that tie into the broader Star Wars mythology.</p>

<h3>Stunning Animation Style</h3>
<p>Combining traditional animation techniques with cutting-edge CGI, the visual style of the new series sets a new standard for Star Wars animation.</p>

<p>The series is set to premiere later this year on Disney+, with a full season of episodes already confirmed.</p>',
  'Lucasfilm announces a new animated series set in the High Republic era.',
  (SELECT id FROM categories WHERE slug = 'star-wars'),
  false,
  'published',
  2,
  'New Star Wars animated series explores the High Republic era with stunning visuals.',
  ARRAY['star wars', 'high republic', 'animation', 'disney plus'],
  (SELECT id FROM users WHERE email = 'admin@fronteirageek.com')
),
(
  'AI Revolution: How Machine Learning is Transforming Tech in 2026',
  'ai-revolution-transforming-tech-2026',
  '<h2>The AI-Powered Future is Here</h2>
<p>Artificial intelligence has moved beyond the hype cycle and into practical, everyday applications that are fundamentally changing how we interact with technology.</p>

<h3>AI in Creative Industries</h3>
<p>From music composition to game development, AI tools are becoming indispensable creative partners rather than replacements for human artists.</p>

<h3>The Hardware Revolution</h3>
<p>New AI-optimized chips and processors are making machine learning accessible on personal devices, bringing powerful AI capabilities to everyone.</p>

<p>The convergence of AI with other technologies like VR, AR, and quantum computing is creating possibilities that were science fiction just a few years ago.</p>',
  'How AI and machine learning are reshaping the tech landscape in 2026.',
  (SELECT id FROM categories WHERE slug = 'tech'),
  false,
  'published',
  3,
  'Explore how artificial intelligence is transforming technology and creative industries in 2026.',
  ARRAY['ai', 'technology', 'machine learning', '2026', 'innovation'],
  (SELECT id FROM users WHERE email = 'admin@fronteirageek.com')
)
ON CONFLICT (slug) DO NOTHING;
