const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ldbgfinipppckroxcqpa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmdmaW5pcHBwY2tyb3hjcXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjA1NDcsImV4cCI6MjA4MDg5NjU0N30.rNSbOAF3ILu6vYOxj-e8Krw1J5ZZYNqaHAshKg0Mp7A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCount() {
  console.log('🔍 Contando registros na tabela airbnb_reviews...');
  
  const { count, error } = await supabase
    .from('airbnb_reviews')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Erro ao contar:', error);
  } else {
    console.log(`📊 Total de registros encontrados: ${count}`);
  }

  // Tentar inserir um registro de teste se estiver vazia
  if (count === 0) {
     console.log('⚠️ Tabela parece vazia. Verifique se você está apontando para o banco correto ou se a tabela tem dados.');
  }
}

checkCount();
