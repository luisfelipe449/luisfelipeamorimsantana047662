-- Add audio support fields to tracks table
ALTER TABLE tracks ADD COLUMN audio_key VARCHAR(255);
ALTER TABLE tracks ADD COLUMN audio_format VARCHAR(10);
ALTER TABLE tracks ADD COLUMN bitrate INTEGER;
ALTER TABLE tracks ADD COLUMN file_size BIGINT;

-- Add index for faster audio key lookups
CREATE INDEX idx_tracks_audio_key ON tracks(audio_key);

-- Add comment descriptions
COMMENT ON COLUMN tracks.audio_key IS 'MinIO storage key for the audio file';
COMMENT ON COLUMN tracks.audio_format IS 'Audio format (MP3, OGG, WAV)';
COMMENT ON COLUMN tracks.bitrate IS 'Audio bitrate in kbps';
COMMENT ON COLUMN tracks.file_size IS 'File size in bytes';