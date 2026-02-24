const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ldbgfinipppckroxcqpa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmdmaW5pcHBwY2tyb3hjcXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjA1NDcsImV4cCI6MjA4MDg5NjU0N30.rNSbOAF3ILu6vYOxj-e8Krw1J5ZZYNqaHAshKg0Mp7A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  console.log('🔍 Verificando estado dos reviews...');
  
  // Consulta 1: Todos os registros (limitado a 5) para ver o que existe
  const { data: allData, error: allError } = await supabase
    .from('airbnb_reviews')
    .select('id, accuracy_rating')
    .limit(5);

  console.log('\n--- Amostra Geral (5 primeiros) ---');
  if (allError) console.error('Erro:', allError);
  else console.table(allData);

  // Consulta 2: Filtrando por null
  const { data: nullData, error: nullError } = await supabase
    .from('airbnb_reviews')
    .select('id, accuracy_rating')
    .is('accuracy_rating', null);

  console.log(`\n--- Registros com accuracy_rating IS NULL: ${nullData ? nullData.length : 0} ---`);
  if (nullData && nullData.length > 0) console.table(nullData.slice(0, 5));

  // Consulta 3: Filtrando por 0 (caso tenha sido inicializado com 0)
  const { data: zeroData, error: zeroError } = await supabase
    .from('airbnb_reviews')
    .select('id, accuracy_rating')
    .eq('accuracy_rating', 0);

  console.log(`\n--- Registros com accuracy_rating == 0: ${zeroData ? zeroData.length : 0} ---`);
}

check();
