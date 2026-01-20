-- Add photo_key, country and active columns to artists table
ALTER TABLE artists ADD COLUMN IF NOT EXISTS photo_key VARCHAR(255);
ALTER TABLE artists ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE artists ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Index for active filter
CREATE INDEX IF NOT EXISTS idx_artists_active ON artists(active);
