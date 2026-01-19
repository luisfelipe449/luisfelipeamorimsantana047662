-- Albums table
CREATE TABLE albums (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    release_year INTEGER,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Index for title search
CREATE INDEX idx_albums_title ON albums(title);
CREATE INDEX idx_albums_release_year ON albums(release_year);
