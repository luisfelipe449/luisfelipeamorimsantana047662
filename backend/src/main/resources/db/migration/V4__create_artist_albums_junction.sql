-- Junction table for N:N relationship between artists and albums
CREATE TABLE artist_albums (
    artist_id BIGINT NOT NULL,
    album_id BIGINT NOT NULL,
    PRIMARY KEY (artist_id, album_id),
    CONSTRAINT fk_artist_albums_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    CONSTRAINT fk_artist_albums_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- Indexes for faster joins
CREATE INDEX idx_artist_albums_artist ON artist_albums(artist_id);
CREATE INDEX idx_artist_albums_album ON artist_albums(album_id);
