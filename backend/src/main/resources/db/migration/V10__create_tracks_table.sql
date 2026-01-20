-- Create tracks table
CREATE TABLE tracks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    track_number INTEGER NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    album_id BIGINT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_album_track_number UNIQUE (album_id, track_number)
);

CREATE INDEX idx_tracks_album_id ON tracks(album_id);

-- Sample data for Harakiri (Serj Tankian)
INSERT INTO tracks (title, track_number, duration, album_id) VALUES
('Cornucopia', 1, 234, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Figure It Out', 2, 261, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Weave On', 3, 206, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Uneducated Democracy', 4, 232, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Harakiri', 5, 218, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Occupied Tears', 6, 178, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Ching Chime', 7, 212, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Tyrant''s Gratitude', 8, 203, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Forget Me Knot', 9, 196, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Butterfly', 10, 188, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Reality TV', 11, 227, (SELECT id FROM albums WHERE title = 'Harakiri')),
('Tao', 12, 225, (SELECT id FROM albums WHERE title = 'Harakiri'));

-- Sample data for Use Your Illusion I (Guns N' Roses)
INSERT INTO tracks (title, track_number, duration, album_id) VALUES
('Right Next Door to Hell', 1, 183, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Dust N'' Bones', 2, 298, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Live and Let Die', 3, 198, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Don''t Cry (Original)', 4, 284, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Perfect Crime', 5, 142, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('You Ain''t the First', 6, 156, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Bad Obsession', 7, 324, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Back Off Bitch', 8, 303, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Double Talkin'' Jive', 9, 282, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('November Rain', 10, 537, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('The Garden', 11, 322, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Garden of Eden', 12, 162, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Don''t Damn Me', 13, 319, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Bad Apples', 14, 268, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Dead Horse', 15, 257, (SELECT id FROM albums WHERE title = 'Use Your Illusion I')),
('Coma', 16, 622, (SELECT id FROM albums WHERE title = 'Use Your Illusion I'));

-- Sample data for Post Traumatic (Mike Shinoda)
INSERT INTO tracks (title, track_number, duration, album_id) VALUES
('Place to Start', 1, 114, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Over Again', 2, 216, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Watching As I Fall', 3, 195, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Nothing Makes Sense Anymore', 4, 180, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('About You (feat. blackbear)', 5, 195, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Brooding', 6, 60, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Promises I Can''t Keep', 7, 210, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Crossing a Line', 8, 210, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Hold It Together', 9, 204, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Ghosts', 10, 183, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Make It Up As I Go (feat. K.Flay)', 11, 193, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Lift Off (feat. Chino Moreno & Machine Gun Kelly)', 12, 210, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('I.O.U.', 13, 184, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Running from My Shadow (feat. grandson)', 14, 218, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('World''s on Fire', 15, 202, (SELECT id FROM albums WHERE title = 'Post Traumatic')),
('Can''t Hear You Now', 16, 241, (SELECT id FROM albums WHERE title = 'Post Traumatic'));
