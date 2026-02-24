-- Adicionar coluna accuracy_rating na tabela airbnb_reviews
ALTER TABLE airbnb_reviews
ADD COLUMN IF NOT EXISTS accuracy_rating INTEGER;
