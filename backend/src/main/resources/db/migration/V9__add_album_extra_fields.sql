-- Add extra fields to albums table: genre, track_count, total_duration
ALTER TABLE albums ADD COLUMN genre VARCHAR(100);
ALTER TABLE albums ADD COLUMN track_count INTEGER DEFAULT 0;
ALTER TABLE albums ADD COLUMN total_duration INTEGER DEFAULT 0;

-- Update sample data with genre, track count, and duration (in seconds)
-- Serj Tankian albums
UPDATE albums SET genre = 'Alternative Rock', track_count = 12, total_duration = 2580 WHERE id = 1; -- Harakiri
UPDATE albums SET genre = 'Electronic', track_count = 3, total_duration = 720 WHERE id = 2; -- Black Blooms
UPDATE albums SET genre = 'Jazz', track_count = 5, total_duration = 1200 WHERE id = 3; -- The Rough Dog

-- Mike Shinoda albums
UPDATE albums SET genre = 'Hip Hop', track_count = 16, total_duration = 3420 WHERE id = 4; -- The Rising Tied
UPDATE albums SET genre = 'Alternative', track_count = 16, total_duration = 3120 WHERE id = 5; -- Post Traumatic
UPDATE albums SET genre = 'Alternative', track_count = 3, total_duration = 660 WHERE id = 6; -- Post Traumatic EP
UPDATE albums SET genre = 'Hip Hop', track_count = 1, total_duration = 228 WHERE id = 7; -- Where'd You Go

-- Michel Telo albums
UPDATE albums SET genre = 'Sertanejo', track_count = 16, total_duration = 3000 WHERE id = 8; -- Bem Sertanejo
UPDATE albums SET genre = 'Sertanejo', track_count = 24, total_duration = 4500 WHERE id = 9; -- Bem Sertanejo - O Show
UPDATE albums SET genre = 'Sertanejo', track_count = 5, total_duration = 900 WHERE id = 10; -- Bem Sertanejo EP

-- Guns N' Roses albums
UPDATE albums SET genre = 'Hard Rock', track_count = 16, total_duration = 4566 WHERE id = 11; -- Use Your Illusion I
UPDATE albums SET genre = 'Hard Rock', track_count = 14, total_duration = 4552 WHERE id = 12; -- Use Your Illusion II
UPDATE albums SET genre = 'Hard Rock', track_count = 14, total_duration = 3180 WHERE id = 13; -- Greatest Hits
