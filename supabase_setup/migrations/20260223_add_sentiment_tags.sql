-- Adicionar colunas de análise de sentimento e tags na tabela airbnb_reviews

-- Adicionar coluna sentiment (TEXT)
ALTER TABLE airbnb_reviews
ADD COLUMN IF NOT EXISTS sentiment TEXT;

-- Adicionar coluna positive_feedback_tags (ARRAY de TEXT)
ALTER TABLE airbnb_reviews
ADD COLUMN IF NOT EXISTS positive_feedback_tags TEXT[];

-- Adicionar coluna improvement_feedback_tags (ARRAY de TEXT)
ALTER TABLE airbnb_reviews
ADD COLUMN IF NOT EXISTS improvement_feedback_tags TEXT[];
