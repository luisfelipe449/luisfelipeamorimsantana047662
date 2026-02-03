-- Adicionar campo active na tabela albums (default true para registros existentes)
ALTER TABLE albums
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Criar índice para otimizar queries de álbuns ativos
CREATE INDEX idx_albums_active ON albums(active);