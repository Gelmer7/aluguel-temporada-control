/**
 * AIRBNB REVIEW SCRAPER (Solução Automatizada Robusta)
 *
 * Este script utiliza o Chrome instalado no seu computador para evitar bloqueios de segurança do Google.
 * Ele extrai avaliações DETALHADAS (Públicas, Privadas e Tags por Categoria).
 *
 * PRÉ-REQUISITOS:
 * 1. Feche TODAS as janelas do Google Chrome antes de rodar este script.
 * 2. Instale dependências: `npm install puppeteer dotenv`
 *
 * COMO USAR:
 * Execute: `node scripts/airbnb-review-scraper.js`
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Tenta encontrar o executável do Chrome automaticamente no Windows
function findChromePath() {
  const paths = [
    process.env.CHROME_PATH, // Se definido manualmente
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
  ];

  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

async function scrapeAirbnbReviews() {
  console.log('🚀 Iniciando o robô de extração DETALHADA de avaliações...');

  const chromePath = findChromePath();
  const userDataDir = path.resolve(__dirname, '../airbnb-session-data');

  if (!chromePath) {
    console.warn(
      '⚠️ Google Chrome não encontrado nos locais padrão. O script usará o Chromium embutido (maior chance de bloqueio).',
    );
  } else {
    console.log(`✅ Google Chrome encontrado em: ${chromePath}`);
  }

  // Configuração do navegador para parecer um usuário real
  const launchOptions = {
    headless: false,
    defaultViewport: null,
    userDataDir: userDataDir, // Salva a sessão aqui!
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  };

  if (chromePath) {
    launchOptions.executablePath = chromePath;
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  // Mascarar o webdriver
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  try {
    console.log('🌍 Acessando o painel de avaliações...');
    // URL principal de reviews (pode ser ajustada para um link específico ou lista geral)
    // Se o usuário passou um ID ou URL como argumento, usa ele
    const userInput = process.argv[2];
    let targetUrl;

    if (userInput) {
        if (userInput.startsWith('http')) {
            targetUrl = userInput;
        } else if (/^\d+$/.test(userInput)) {
            // Se for apenas números, assume que é o ID
            targetUrl = `https://www.airbnb.com.br/progress/reviews/details/${userInput}`;
        } else {
            console.error('❌ Argumento inválido. Use uma URL completa ou o ID da avaliação.');
            process.exit(1);
        }
        console.log(`🎯 Alvo definido via argumento: ${targetUrl}`);
    } else {
        // Fallback padrão (última avaliação conhecida)
        targetUrl = 'https://www.airbnb.com.br/progress/reviews/details/1593634609766709296';
        console.log(`⚠️ Nenhum argumento fornecido. Usando URL padrão: ${targetUrl}`);
        console.log(`💡 Dica: Você pode rodar "node scripts/airbnb-review-scraper.js <ID_OU_URL>" para extrair outra avaliação.`);
    }

    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // Verifica se precisa de login
    if (page.url().includes('login') || page.url().includes('auth')) {
      console.log('\n🔴 VOCÊ PRECISA FAZER LOGIN!');
      console.log('👉 Por favor, faça login MANUALMENTE no navegador que abriu.');
      console.log(
        '👉 DICA: Se o login com Google falhar, tente usar Email/Senha ou "Link Mágico".',
      );
      console.log('⏳ O script vai esperar até você logar e ser redirecionado...\n');

      await page.waitForFunction(
        () => !window.location.href.includes('login') && !window.location.href.includes('auth'),
        { timeout: 0 },
      );

      console.log('✅ Login detectado! Salvando sessão e continuando...');
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      console.log('✅ Sessão anterior recuperada! Você já está logado.');
    }

    // Se não estiver na página de reviews e nem numa página de detalhes, vai para lá
    const currentUrl = page.url();
    if (!currentUrl.includes('/reviews') && !currentUrl.includes('/details/')) {
      console.log('🔄 Navegando para a página de avaliações...');
      await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    }

    const detailedReviews = [];

    // MODO 1: Página de Detalhe Única (Detectada Automaticamente)
    if (page.url().includes('/details/')) {
      console.log('🎯 Detectada página de detalhe de avaliação única!');

      // Extrai os dados da página atual
      try {
        const data = await extractDetailedReviewData(page);
        data.url = page.url();
        const urlParts = data.url.split('/');
        data.id = urlParts[urlParts.length - 1]; // O último segmento é o ID
        detailedReviews.push(data);
        console.log('✅ Dados extraídos com sucesso da página atual!');
      } catch (err) {
        console.error('❌ Erro ao extrair dados da página atual:', err);
      }
    } else {
      // MODO 2: Lista de Avaliações (Iteração)
      console.log('👀 Carregando lista de avaliações...');

      // Espera a lista de reviews carregar (pode ser data-testid="review-card" ou linhas de tabela)
      try {
        await page.waitForSelector(
          '[role="row"], [data-testid="review-card"], a[href*="/reviews/details/"]',
          { timeout: 15000 },
        );
      } catch (e) {
        console.log('⚠️ A lista de avaliações demorou para carregar ou está vazia.');
      }

      // Coleta os links para os detalhes de cada review
      const reviewLinks = await page.evaluate(() => {
        // Tenta encontrar links diretos para detalhes
        const links = Array.from(document.querySelectorAll('a[href*="/reviews/details/"]'));
        if (links.length > 0) return links.map((l) => l.href);
        return null;
      });

      if (reviewLinks && reviewLinks.length > 0) {
        console.log(`📋 Encontrados ${reviewLinks.length} links de avaliações. Processando...`);

        // Removemos o limite rígido, mas vamos processar com calma
        const linksToProcess = reviewLinks;

        for (const link of linksToProcess) {
          console.log(`Processing: ${link}`);
          try {
            const detailPage = await browser.newPage();
            await detailPage.goto(link, { waitUntil: 'networkidle2' });

            // Extrai os dados da página de detalhe
            const data = await extractDetailedReviewData(detailPage);

            // Adiciona o link original e ID para referência
            data.url = link;
            const urlParts = link.split('/');
            data.id = urlParts[urlParts.length - 1]; // O último segmento é o ID

            detailedReviews.push(data);

            await detailPage.close();

            // Delay aleatório para não parecer robô
            await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
          } catch (err) {
            console.error(`Erro ao processar ${link}:`, err.message);
          }
        }
      } else {
        console.log(
          '⚠️ Não foram encontrados links diretos. Tentando estratégia de clique em linhas (Modal)...',
        );
        // Estratégia de clicar nos itens da lista (se for SPA com modal)
        // IMPLEMENTAÇÃO FUTURA: Requer seletores mais complexos para identificar linhas clicáveis e modais
        console.log(
          '❌ Esta estratégia requer ajustes específicos para o layout atual do seu painel.',
        );
      }
    }

    console.log(`📦 Extraídas ${detailedReviews.length} avaliações detalhadas!`);

    if (detailedReviews.length > 0) {
      const outputPath = path.resolve(__dirname, 'reviews-detailed.json');
      fs.writeFileSync(outputPath, JSON.stringify(detailedReviews, null, 2));
      console.log(`💾 Dados salvos em: ${outputPath}`);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    console.log('👋 Encerrando navegador...');
    await browser.close();
  }
}

// Função que roda NO NAVEGADOR para extrair dados da página de detalhe
async function extractDetailedReviewData(page) {
  return await page.evaluate(() => {
    // Estrutura de retorno solicitada pelo usuário
    const result = {
      avaliacaoGeral: {},
      feedbackDetalhado: {},
    };

    // Helper para pegar texto por XPath ou seletores de texto
    const getTextByHeader = (headerTextList) => {
      // Validação rigorosa de conteúdo
      const isValidText = (t) => {
        if (!t) return false;
        const clean = t.trim();
        if (clean.length < 5) return false;
        if (clean.includes('Feedback detalhado')) return false;
        if (clean.includes('Check-in')) return false;
        if (clean.includes('Limpeza')) return false;
        if (clean.includes('Exatidão do anúncio')) return false;
        if (clean.includes('Comunicação')) return false;
        if (clean.includes('Localização')) return false;
        if (clean.includes('Custo-benefício')) return false;
        if (clean.includes('Excluir') && clean.includes('Editar')) return false; // Botões
        if (clean.startsWith('Avaliação pública')) return false;
        if (clean.startsWith('Mensagem privada')) return false;
        if (clean.startsWith('Sua resposta')) return false;
        if (clean.includes('Rodapé do site')) return false;
        return true;
      };

      // Função genérica de "Subir e Olhar Irmãos"
      const findContentFromHeader = (headerEl) => {
        if (!headerEl) return null;

        let current = headerEl;
        // Sobe até 6 níveis na árvore DOM
        for (let i = 0; i < 6; i++) {
          // Verifica todos os irmãos seguintes neste nível
          let sibling = current.nextElementSibling;
          let siblingCount = 0;

          // Verifica até 5 irmãos seguintes (pode haver elementos vazios)
          while (sibling && siblingCount < 5) {
            // Prioridade 1: Div com dir="ltr" (Padrão Airbnb para texto de usuário)
            // Verifica se o irmão é o próprio container de texto
            if (sibling.getAttribute('dir') === 'ltr' && isValidText(sibling.innerText)) {
              // Tenta pegar o filho direto se tiver, para evitar wrappers extras
              const deepDiv = sibling.querySelector('div');
              return deepDiv ? deepDiv.innerText.trim() : sibling.innerText.trim();
            }

            // Prioridade 2: Div com dir="ltr" DENTRO do irmão
            const ltrDiv = sibling.querySelector('div[dir="ltr"]');
            if (ltrDiv && isValidText(ltrDiv.innerText)) {
              return ltrDiv.innerText.trim();
            }

            // Prioridade 3: Texto direto do irmão (se válido e longo o suficiente)
            if (isValidText(sibling.innerText)) {
              return sibling.innerText.trim();
            }

            sibling = sibling.nextElementSibling;
            siblingCount++;
          }

          // Sobe para o pai
          if (current.parentElement) {
            current = current.parentElement;
          } else {
            break;
          }
        }
        return null;
      };

      // Estratégia Especializada por Tipo de Campo

      // 1. Avaliação Pública (H1 exato)
      if (headerTextList.includes('Avaliação pública')) {
        const h1s = Array.from(document.querySelectorAll('h1'));
        const header = h1s.find(
          (el) => el.innerText && el.innerText.trim() === 'Avaliação pública',
        );
        const result = findContentFromHeader(header);
        if (result) return result;
      }

      // 2. Mensagem Privada (H1 começando com...)
      if (headerTextList.includes('Mensagem privada')) {
        const h1s = Array.from(document.querySelectorAll('h1'));
        // Procura H1 que contém "Mensagem privada"
        const header = h1s.find(
          (el) => el.innerText && el.innerText.trim().startsWith('Mensagem privada'),
        );
        const result = findContentFromHeader(header);
        if (result) return result;
      }

      // 3. Sua Resposta Pública (Div com texto exato)
      if (headerTextList.includes('Sua resposta pública')) {
        // Procura elementos que tenham o texto "Sua resposta pública"
        const allElements = Array.from(
          document.querySelectorAll('h2, h3, h4, div, span, strong, b'),
        );

        // Filtra elementos que são "folhas" ou quase folhas com esse texto
        const potentialHeaders = allElements.filter((el) => {
          const text = el.innerText ? el.innerText.trim() : '';
          return text.toLowerCase() === 'sua resposta pública';
        });

        // Tenta encontrar conteúdo a partir de qualquer um dos headers encontrados
        for (const header of potentialHeaders) {
          // Estratégia Específica para "Sua Resposta Pública" baseada no snippet HTML do usuário:
          // Header -> Irmão Imediato (Content)
          // Evita buscar divs profundos para não pegar elementos vazios

          let sibling = header.nextElementSibling;
          let count = 0;

          // Verifica até 3 irmãos (caso haja espaçadores)
          while (sibling && count < 3) {
            // Verifica se é um container de texto válido
            if (isValidText(sibling.innerText)) {
              // Se tiver dir="ltr", é o candidato perfeito (padrão Airbnb)
              if (sibling.getAttribute('dir') === 'ltr') {
                return sibling.innerText.trim();
              }
              // Se não, retorna o texto do irmão mesmo assim
              return sibling.innerText.trim();
            }
            sibling = sibling.nextElementSibling;
            count++;
          }

          // Se não achou no irmão imediato, tenta a estratégia genérica de subir na árvore
          const result = findContentFromHeader(header);
          if (result) return result;
        }
      }

      return null;
    };

    // Helper para pegar nota da Avaliação Geral (Topo)
    const getOverallRating = () => {
      // Procura por "Avaliação geral"
      const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, div, span'));
      const header = headers.find(
        (el) => el.innerText && el.innerText.trim() === 'Avaliação geral',
      );

      if (header) {
        // A nota geralmente está no mesmo container (flex) ou no próximo irmão
        // Ex: <div><h2>Avaliação geral</h2><div>4 ★</div></div>

        // 1. Procura no pai imediato (flex container)
        if (header.parentElement) {
          const text = header.parentElement.innerText;
          const match = text.match(/(\d[\.,]\d|\d)\s*(★|estrelas)/);
          if (match) return match[1];

          // Se tem SVG de estrela
          const svg = header.parentElement.querySelector('svg[aria-label*="estrelas"]');
          if (svg) {
            const ariaLabel = svg.getAttribute('aria-label');
            const matchSvg = ariaLabel.match(/(\d[\.,]?\d?)/);
            if (matchSvg) return matchSvg[1];
          }
        }

        // 2. Procura no próximo irmão (caso seja colunas)
        const sibling = header.nextElementSibling;
        if (sibling) {
          const text = sibling.innerText;
          const match = text.match(/(\d[\.,]\d|\d)/);
          if (match) return match[1];
        }
      }

      // Fallback: Procura qualquer elemento com aria-label "X estrelas" que seja grande (h1/h2 context)
      // ou o primeiro rating da página
      const starEl = document.querySelector('[aria-label*="estrelas"]');
      if (starEl) {
        const label = starEl.getAttribute('aria-label');
        const match = label.match(/(\d[\.,]?\d?)/);
        if (match) return match[1];
      }

      return null;
    };

    // Helper para pegar nota de categoria
    const getRatingByCategory = (categoryTextList) => {
      // Baseado no HTML fornecido:
      // <div class="... dir dir-ltr">
      //   <h3 ...>Check-in</h3>
      //   <div class="...">
      //     <div ... aria-hidden="true">5</div>
      //     <div><svg ... aria-label="5 estrelas"></svg></div>
      //   </div>
      // </div>

      const allHeaders = Array.from(document.querySelectorAll('h3, h2, h4'));
      const header = allHeaders.find((el) => {
        if (!el.innerText) return false;
        const text = el.innerText.trim();
        // Correspondência exata ou "Começa com" para garantir que pegamos o título da seção
        return categoryTextList.some((cat) => text === cat || text.startsWith(cat + '\n'));
      });

      if (header) {
        // No HTML fornecido, o container da nota é o PRÓXIMO IRMÃO do H3
        // Estrutura: H3 (Label) + DIV (Container Nota)
        const ratingContainer = header.nextElementSibling;

        if (ratingContainer) {
          // 1. Tenta pegar o número visível (ex: <div ...>5</div>)
          // O número geralmente está no primeiro filho div
          const visibleNumber = ratingContainer.innerText.trim().match(/^(\d[\.,]?\d?)/);
          if (visibleNumber) {
            return visibleNumber[1];
          }

          // 2. Tenta pegar pelo aria-label do SVG (ex: aria-label="5 estrelas")
          const svg = ratingContainer.querySelector('svg[aria-label]');
          if (svg) {
            const ariaLabel = svg.getAttribute('aria-label');
            const match = ariaLabel.match(/(\d[\.,]?\d?)/);
            if (match) return match[1];
          }
        }

        // Fallback: Se a estrutura for ligeiramente diferente (ex: dentro de um pai comum)
        // Sobe um nível e procura o número
        const parent = header.parentElement;
        if (parent) {
          const text = parent.innerText;
          // Procura número isolado no final da linha ou bloco
          const match = text.match(/(\d[\.,]?\d?)\s*$/m);
          if (match && !header.innerText.includes(match[1])) {
            return match[1];
          }
        }
      }
      return null;
    };

    // --- GRUPO 1: Avaliação Geral ---

    // Estrelas da Avaliação Geral
    const overallRating = getOverallRating();
    if (overallRating) {
      result.avaliacaoGeral.estrelasAvaliacaoGeral = parseFloat(overallRating.replace(',', '.'));
    }

    // Avaliação pública
    result.avaliacaoGeral.avaliacaoPublica = getTextByHeader([
      'Avaliação pública',
      'Public review',
      'Comentário público',
    ]);

    // Sua resposta pública (se tiver)
    result.avaliacaoGeral.suaRespostaPublica = getTextByHeader([
      'Sua resposta pública',
      'Sua resposta',
      'Your response',
      'Respuesta pública',
    ]);

    // Mensagem privada
    result.avaliacaoGeral.mensagemPrivada = getTextByHeader([
      'Mensagem privada',
      'Private feedback',
      'Private note',
      'O que Fulano adorou',
    ]);

    // --- GRUPO 2: Feedback Detalhado (Estrelas) ---

    const categories = {
      Limpeza: 'limpeza',
      Cleanliness: 'limpeza',

      Exatidão: 'exatidaoDoAnuncio',
      'Exatidão do anúncio': 'exatidaoDoAnuncio',
      Accuracy: 'exatidaoDoAnuncio',
      Veracidade: 'exatidaoDoAnuncio',

      'Check-in': 'checkIn',

      Comunicação: 'comunicacao',
      Communication: 'comunicacao',

      Localização: 'localizacao',
      Location: 'localizacao',

      'Custo-benefício': 'custoBeneficio',
      Value: 'custoBeneficio',
    };

    for (const [key, field] of Object.entries(categories)) {
      const rating = getRatingByCategory([key]);
      if (rating) {
        const num = parseFloat(rating.replace(',', '.'));
        result.feedbackDetalhado[field] = num;
      }
    }

    // Adiciona dados de contexto para identificar a reserva (mesmo que não pedido explicitamente, é essencial)
    const h1 = document.querySelector('h1');
    const title = h1 ? h1.innerText : '';
    if (title.includes('Avaliação de ')) {
      result.nomeHospede = title.replace('Avaliação de ', '').split(' ')[0];
    }

    return result;
  });
}

scrapeAirbnbReviews();
