-- Este script deve ser executado no SQL Editor do Supabase.
-- Ele gera a saída já no formato JSON para que você possa copiar e colar diretamente no arquivo 'reviews_to_update.json'

SELECT 
    json_agg(
        json_build_object(
            'id', id,
            'review_url', review_url,
            'guest_name', guest_name
        )
    )
FROM airbnb_reviews
WHERE 
    accuracy_rating IS NULL 
    AND review_url IS NOT NULL;
