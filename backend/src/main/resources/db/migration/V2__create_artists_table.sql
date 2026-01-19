-- Artists table
CREATE TABLE artists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    biography TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Index for name search and sorting
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_type ON artists(type);
