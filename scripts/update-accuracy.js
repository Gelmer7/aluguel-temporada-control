const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---
const SUPABASE_URL = 'https://ldbgfinipppckroxcqpa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmdmaW5pcHBwY2tyb3hjcXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjA1NDcsImV4cCI6MjA4MDg5NjU0N30.rNSbOAF3ILu6vYOxj-e8Krw1J5ZZYNqaHAshKg0Mp7A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para encontrar o Chrome instalado
function findChromePath() {
  const paths = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(require('os').homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
  ];

  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// Função de delay aleatório
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Iniciando script de atualização de "Exatidão do Anúncio"...');

  // 1. Buscar reviews que precisam de atualização
  const { data: reviews, error } = await supabase
    .from('airbnb_reviews')
    .select('id, review_url, guest_name')
    .is('accuracy_rating', null)
    .not('review_url', 'is', null);

  if (error) {
    console.error('❌ Erro ao buscar reviews:', error);
    return;
  }

  console.log(`📊 Encontrados ${reviews.length} reviews pendentes de atualização.`);

  if (reviews.length === 0) {
    console.log('✅ Todos os reviews já estão atualizados!');
    return;
  }

  // 2. Configurar Navegador
  const chromePath = findChromePath();
  const userDataDir = path.resolve(__dirname, '../airbnb-session-data');

  console.log(`🌍 Abrindo navegador (UserData: ${userDataDir})...`);
  console.log('⚠️  IMPORTANTE: Se o navegador abrir e pedir login, FAÇA O LOGIN MANUALMENTE na janela aberta.');

  const browser = await puppeteer.launch({
    headless: false, // Precisa ser false para você ver e logar se necessário
    executablePath: chromePath,
    userDataDir: userDataDir,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 3. Loop pelos reviews
  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    console.log(`\n[${i + 1}/${reviews.length}] Processando review de ${review.guest_name}...`);
    console.log(`🔗 URL: ${review.review_url}`);

    try {
      await page.goto(review.review_url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Pequeno delay para garantir renderização dinâmica
      await delay(2000 + Math.random() * 2000);

      // Tenta extrair a nota de Exatidão
      const accuracyRating = await page.evaluate(() => {
        const keywords = ['exatidão', 'accuracy', 'veracidade', 'exatidao'];
        
        // Função auxiliar para verificar se o texto contém uma das palavras-chave
        const containsKeyword = (text) => {
            if (!text) return false;
            const lower = text.toLowerCase();
            return keywords.some(k => lower.includes(k));
        };

        // Estratégia 1: Procurar elementos de texto visíveis
        const allElements = Array.from(document.querySelectorAll('div, span, li, p'));
        
        for (const el of allElements) {
            // Ignora elementos ocultos ou vazios
            if (!el.offsetParent || !el.textContent.trim()) continue;

            if (containsKeyword(el.textContent)) {
                // Encontrou o rótulo! Agora precisa achar o número associado.
                // O número geralmente está próximo no DOM (irmão ou pai/filho)
                
                // Tenta encontrar um número no próprio elemento ou nos pais próximos
                let container = el;
                let rating = null;
                
                // Sobe até 3 níveis para tentar achar o container da linha
                for (let i = 0; i < 3; i++) {
                    if (!container) break;
                    
                    const text = container.innerText || '';
                    // Procura por padrão de nota: "5.0", "4.8", "5", etc.
                    // Evita datas ou outros números (geralmente notas são X.X ou X,0)
                    const match = text.match(/(\d[.,]\d)/);
                    
                    if (match) {
                        rating = parseFloat(match[1].replace(',', '.'));
                        // Valida se é uma nota válida (0 a 5)
                        if (rating >= 0 && rating <= 5) {
                            return rating;
                        }
                    }
                    container = container.parentElement;
                }
            }
        }
        return null;
      });

      if (accuracyRating) {
        console.log(`✅ Nota encontrada: ${accuracyRating}`);
        
        // Atualiza no Supabase
        const { error: updateError } = await supabase
          .from('airbnb_reviews')
          .update({ accuracy_rating: accuracyRating })
          .eq('id', review.id);

        if (updateError) {
          console.error('❌ Erro ao salvar no banco:', updateError);
        } else {
          console.log('💾 Salvo no banco com sucesso!');
        }
      } else {
        console.warn('⚠️ Não foi possível encontrar a nota de Exatidão nesta página.');
        // Pode ser que a página seja diferente ou o review não tenha essa nota específica
      }

    } catch (err) {
      console.error(`❌ Erro ao processar review de ${review.guest_name}:`, err.message);
    }

    // Delay entre requisições para evitar bloqueio (5 a 10 segundos)
    const waitTime = 5000 + Math.random() * 5000;
    console.log(`⏳ Aguardando ${Math.round(waitTime/1000)}s antes do próximo...`);
    await delay(waitTime);
  }

  console.log('\n🎉 Processo finalizado!');
  await browser.close();
}

main().catch(console.error);
