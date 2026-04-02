-- Vibe / mood field for activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS vibe text
  CHECK (vibe IN ('Chill', 'Kompetitiv', 'Abenteuer', 'Kultur', 'Party'));
