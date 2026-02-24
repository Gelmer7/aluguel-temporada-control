const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// --- CONFIGURAÇÃO ---
const INPUT_FILE = path.join(__dirname, 'reviews_to_update.json');
const OUTPUT_SQL_FILE = path.join(__dirname, 'update_accuracy.sql');

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
  console.log('🚀 Iniciando script de extração (Modo Offline/Manual)...');

  // 1. Ler reviews do arquivo JSON
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Arquivo de entrada não encontrado: ${INPUT_FILE}`);
    console.log('💡 Crie este arquivo com um array de objetos: [{ "id": 1, "review_url": "..." }]');
    return;
  }

  const reviews = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(`📊 Lendo ${reviews.length} reviews do arquivo local.`);

  if (reviews.length === 0) {
    console.log('⚠️ O arquivo está vazio. Adicione URLs para processar.');
    return;
  }

  // 2. Configurar Navegador
  const chromePath = findChromePath();
  const userDataDir = path.resolve(__dirname, '../airbnb-session-data');

  console.log(`🌍 Abrindo navegador...`);
  console.log('⚠️  IMPORTANTE: Se pedir login, FAÇA MANUALMENTE.');

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromePath,
    userDataDir: userDataDir,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Limpa o arquivo de saída anterior
  fs.writeFileSync(OUTPUT_SQL_FILE, '-- Script gerado automaticamente\n\n');

  // 3. Loop pelos reviews
  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    console.log(`\n[${i + 1}/${reviews.length}] Acessando review ID ${review.id}...`);
    console.log(`🔗 URL: ${review.review_url}`);

    try {
      // Navegação mais robusta
      await page.goto(review.review_url, { waitUntil: 'domcontentloaded', timeout: 90000 });

      // Espera um pouco para garantir que elementos dinâmicos carreguem
      await delay(5000 + Math.random() * 2000);

      // Tenta extrair a nota de Exatidão usando seletores específicos do Airbnb
      const accuracyRating = await page.evaluate(() => {
        try {
            // Helpers
            const cleanText = (txt) => txt ? txt.trim().toLowerCase() : '';

            // Estratégia 1: Modal de Reviews (novo design)
            // Procura por labels de rating
            const ratingRows = Array.from(document.querySelectorAll('div[role="listitem"], div._1y33261'));

            for (const row of ratingRows) {
                const text = cleanText(row.innerText);
                if (text.includes('exatidão') || text.includes('accuracy') || text.includes('veracidade')) {
                    // Atualizado para aceitar inteiros (ex: "5" ou "5.0")
                    const match = text.match(/\b([1-5](?:[.,]\d)?)\b/);
                    if (match) {
                        return parseFloat(match[1].replace(',', '.'));
                    }
                }
            }

            // Estratégia 2: Busca genérica por texto próximo (backup)
            const allElements = Array.from(document.querySelectorAll('div, span, li, h3, h4'));
            const keywords = ['exatidão', 'accuracy', 'veracidade'];

            for (const el of allElements) {
                if (!el.offsetParent || !el.textContent.trim()) continue;

                // Verifica se é o elemento de texto "Exatidão"
                if (keywords.some(k => cleanText(el.textContent) === k || cleanText(el.textContent).startsWith(k))) {
                    // Tenta achar o número no container pai
                    let container = el.parentElement;
                    for (let i = 0; i < 4; i++) { // Sobe até 4 níveis
                        if (!container) break;
                        const containerText = container.innerText || '';
                        // Procura número isolado ou no final da linha (inteiro ou decimal)
                        // Regex melhorado: busca 1 a 5, opcionalmente seguido de .X ou ,X
                        // Ignora datas como 2023, etc.
                        const match = containerText.match(/\b([1-5](?:[.,]\d)?)\b/);
                        if (match) {
                            return parseFloat(match[1].replace(',', '.'));
                        }
                        container = container.parentElement;
                    }
                }
            }

            return null;
        } catch (e) {
            return null;
        }
      });

      if (accuracyRating) {
        console.log(`✅ Nota encontrada: ${accuracyRating}`);
        const sqlCommand = `UPDATE airbnb_reviews SET accuracy_rating = ${accuracyRating} WHERE id = ${review.id}; -- ${review.guest_name}\n`;
        fs.appendFileSync(OUTPUT_SQL_FILE, sqlCommand);
        console.log('📝 Comando SQL adicionado ao arquivo.');
      } else {
        console.warn('⚠️ Nota não encontrada. Tirando screenshot de debug...');
        try {
            await page.screenshot({ path: `debug_fail_${review.id}.png` });
        } catch(e) {}
        fs.appendFileSync(OUTPUT_SQL_FILE, `-- FALHA: Não foi possível ler accuracy_rating para ID ${review.id} (${review.review_url})\n`);
      }

    } catch (err) {
      console.error(`❌ Erro ao processar:`, err.message);
      fs.appendFileSync(OUTPUT_SQL_FILE, `-- ERRO: ${err.message} para ID ${review.id}\n`);
    }

    const waitTime = 3000 + Math.random() * 3000;
    console.log(`⏳ Aguardando...`);
    await delay(waitTime);
  }

  console.log(`\n🎉 Processo finalizado! Script SQL gerado em: ${OUTPUT_SQL_FILE}`);
  await browser.close();
}

main().catch(console.error);
