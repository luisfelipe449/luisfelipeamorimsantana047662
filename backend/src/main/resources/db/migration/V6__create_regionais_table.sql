-- Regionais table for sync with external API
-- Requirement: regional (id integer, nome varchar(200), ativo boolean)
CREATE TABLE regionais (
    id INTEGER PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index for active regionais
CREATE INDEX idx_regionais_ativo ON regionais(ativo);
