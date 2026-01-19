-- Album covers table (MinIO object keys)
CREATE TABLE album_covers (
    album_id BIGINT NOT NULL,
    cover_key VARCHAR(500) NOT NULL,
    CONSTRAINT fk_album_covers_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- Index for album lookup
CREATE INDEX idx_album_covers_album ON album_covers(album_id);
