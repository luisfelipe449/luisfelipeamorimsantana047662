-- Insert admin user (password: admin123 - BCrypt encoded)
INSERT INTO users (username, password, name, email, role, active)
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Administrador', 'admin@pss.mt.gov.br', 'ADMIN', true);

-- Insert sample artists as specified in the process requirements
-- Serj Tankian (Solo artist)
INSERT INTO artists (id, name, type, biography)
VALUES (1, 'Serj Tankian', 'SOLO', 'Serj Tankian é um cantor, compositor e multi-instrumentista armênio-americano, mais conhecido como vocalista da banda System of a Down.');

-- Mike Shinoda (Solo artist)
INSERT INTO artists (id, name, type, biography)
VALUES (2, 'Mike Shinoda', 'SOLO', 'Mike Shinoda é um músico, rapper, cantor, compositor e produtor musical americano, co-fundador da banda Linkin Park.');

-- Michel Teló (Solo artist)
INSERT INTO artists (id, name, type, biography)
VALUES (3, 'Michel Teló', 'SOLO', 'Michel Teló é um cantor, compositor e músico brasileiro de música sertaneja.');

-- Guns N' Roses (Band)
INSERT INTO artists (id, name, type, biography)
VALUES (4, 'Guns N'' Roses', 'BAND', 'Guns N'' Roses é uma banda americana de hard rock formada em Los Angeles em 1985.');

-- Reset sequence to continue after manual IDs
SELECT setval('artists_id_seq', (SELECT MAX(id) FROM artists));

-- Insert albums for Serj Tankian
INSERT INTO albums (id, title, release_year, description)
VALUES
    (1, 'Harakiri', 2012, 'Terceiro álbum de estúdio solo de Serj Tankian.'),
    (2, 'Black Blooms', 2019, 'EP colaborativo de Serj Tankian.'),
    (3, 'The Rough Dog', 2018, 'Álbum de Serj Tankian.');

-- Insert albums for Mike Shinoda
INSERT INTO albums (id, title, release_year, description)
VALUES
    (4, 'The Rising Tied', 2005, 'Álbum de estreia solo de Mike Shinoda sob o nome Fort Minor.'),
    (5, 'Post Traumatic', 2018, 'Álbum solo de Mike Shinoda sobre a perda de Chester Bennington.'),
    (6, 'Post Traumatic EP', 2018, 'EP de Mike Shinoda.'),
    (7, 'Where''d You Go', 2006, 'Single de Fort Minor.');

-- Insert albums for Michel Teló
INSERT INTO albums (id, title, release_year, description)
VALUES
    (8, 'Bem Sertanejo', 2014, 'Álbum de estúdio de Michel Teló.'),
    (9, 'Bem Sertanejo - O Show (Ao Vivo)', 2015, 'Álbum ao vivo de Michel Teló.'),
    (10, 'Bem Sertanejo - (1ª Temporada) - EP', 2014, 'EP da série Bem Sertanejo.');

-- Insert albums for Guns N' Roses
INSERT INTO albums (id, title, release_year, description)
VALUES
    (11, 'Use Your Illusion I', 1991, 'Terceiro álbum de estúdio do Guns N'' Roses.'),
    (12, 'Use Your Illusion II', 1991, 'Quarto álbum de estúdio do Guns N'' Roses.'),
    (13, 'Greatest Hits', 2004, 'Compilação de maiores sucessos do Guns N'' Roses.');

-- Reset sequence to continue after manual IDs
SELECT setval('albums_id_seq', (SELECT MAX(id) FROM albums));

-- Create artist-album relationships
-- Serj Tankian albums
INSERT INTO artist_albums (artist_id, album_id) VALUES (1, 1), (1, 2), (1, 3);

-- Mike Shinoda albums
INSERT INTO artist_albums (artist_id, album_id) VALUES (2, 4), (2, 5), (2, 6), (2, 7);

-- Michel Teló albums
INSERT INTO artist_albums (artist_id, album_id) VALUES (3, 8), (3, 9), (3, 10);

-- Guns N' Roses albums
INSERT INTO artist_albums (artist_id, album_id) VALUES (4, 11), (4, 12), (4, 13);
