export function analyzeSentiment(text: string, rating?: number): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
  if (rating !== undefined) {
    if (rating >= 5) return 'POSITIVE';
    if (rating <= 3) return 'NEGATIVE';
  }

  const lower = text.toLowerCase();
  const positiveWords = [
    'excelente', 'ótimo', 'perfeito', 'maravilhoso', 'incrível', 'adorei', 'recomendo',
    // limpeza e conforto (variações)
    'limpo', 'limpa', 'limpos', 'limpas',
    'cheiroso', 'cheirosa',
    'confortável',
    // localização
    'bem localizado'
  ];
  const negativeWords = [
    'ruim', 'péssimo', 'sujo', 'barulho', 'longe', 'falta', 'quebrado', 'problema', 'decepção', 'não recomendo',
    // odores negativos (evitar falso positivo com "cheirosa")
    'mau cheiro', 'cheiro ruim', 'odor', 'fedor', 'mofo', 'cheiro de mofo'
  ];

  let score = 0;
  positiveWords.forEach(w => { if (lower.includes(w)) score++; });
  negativeWords.forEach(w => { if (lower.includes(w)) score--; });

  if (score > 0) return 'POSITIVE';
  if (score < 0) return 'NEGATIVE';
  return 'NEUTRAL';
}

// Faz correspondência por "palavra inteira" para evitar falso positivo (ex.: "cheiro" não deve bater em "cheirosa")
function matchWord(lowerText: string, word: string): boolean {
  // frases compostas mantêm includes
  if (word.trim().includes(' ')) return lowerText.includes(word);
  const pattern = new RegExp(`\\b${word}\\b`, 'i');
  return pattern.test(lowerText);
}

export function extractTags(text: string): { positive: string[], improvement: string[] } {
  const lower = text.toLowerCase();
  const positive: string[] = [];
  const improvement: string[] = [];

  // Mapeamento de palavras-chave para tags
  const rules = [
    {
      key: 'Limpeza',
      pos: ['limpo', 'limpa', 'limpos', 'limpas', 'impecável', 'cheiroso', 'cheirosa'],
      neg: ['sujo', 'poeira', 'mancha', 'inseto', 'mau cheiro', 'cheiro ruim', 'odor', 'fedor', 'cheiro de mofo', 'mofo']
    },
    {
      key: 'Localização',
      pos: ['bem localizado', 'perto', 'fácil acesso', 'localização'],
      neg: ['longe', 'difícil acesso', 'perigoso']
    },
    {
      key: 'Conforto',
      pos: ['confortável', 'aconchegante', 'espaçoso', 'cama boa'],
      neg: ['apertado', 'desconfortável', 'cama dura', 'barulho']
    },
    {
      key: 'Atendimento',
      pos: ['atencioso', 'rápido', 'gentil', 'prestativo'],
      neg: ['demora', 'grosso', 'não respondeu']
    },
    {
      key: 'Instalações',
      pos: ['novo', 'moderno', 'equipado'],
      neg: ['velho', 'quebrado', 'falta', 'antigo']
    }
  ];

  rules.forEach(rule => {
    const hasPos = rule.pos.some(w => matchWord(lower, w));
    const hasNeg = rule.neg.some(w => matchWord(lower, w));

    if (hasPos) positive.push(rule.key);
    // Evita classificar como negativo quando só há elogios (ex.: "cheirosa")
    if (hasNeg && !hasPos) improvement.push(rule.key);
  });

  return { positive, improvement };
}
