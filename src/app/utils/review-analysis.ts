export function analyzeSentiment(text: string, rating?: number): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
  if (rating !== undefined) {
    if (rating >= 5) return 'POSITIVE';
    if (rating <= 3) return 'NEGATIVE';
  }

  const lower = text.toLowerCase();
  const positiveWords = ['excelente', 'ótimo', 'perfeito', 'maravilhoso', 'incrível', 'adorei', 'recomendo', 'limpo', 'confortável', 'bem localizado'];
  const negativeWords = ['ruim', 'péssimo', 'sujo', 'barulho', 'longe', 'falta', 'quebrado', 'problema', 'decepção', 'não recomendo'];

  let score = 0;
  positiveWords.forEach(w => { if (lower.includes(w)) score++; });
  negativeWords.forEach(w => { if (lower.includes(w)) score--; });

  if (score > 0) return 'POSITIVE';
  if (score < 0) return 'NEGATIVE';
  return 'NEUTRAL';
}

export function extractTags(text: string): { positive: string[], improvement: string[] } {
  const lower = text.toLowerCase();
  const positive: string[] = [];
  const improvement: string[] = [];

  // Mapeamento de palavras-chave para tags
  const rules = [
    { key: 'Limpeza', pos: ['limpo', 'impecável', 'cheiroso'], neg: ['sujo', 'poeira', 'cheiro', 'mancha', 'inseto'] },
    { key: 'Localização', pos: ['bem localizado', 'perto', 'fácil acesso', 'localização'], neg: ['longe', 'difícil acesso', 'perigoso'] },
    { key: 'Conforto', pos: ['confortável', 'aconchegante', 'espaçoso', 'cama boa'], neg: ['apertado', 'desconfortável', 'cama dura', 'barulho'] },
    { key: 'Atendimento', pos: ['atencioso', 'rápido', 'gentil', 'prestativo'], neg: ['demora', 'grosso', 'não respondeu'] },
    { key: 'Instalações', pos: ['novo', 'moderno', 'equipado'], neg: ['velho', 'quebrado', 'falta', 'antigo'] }
  ];

  rules.forEach(rule => {
    if (rule.pos.some(w => lower.includes(w))) positive.push(rule.key);
    if (rule.neg.some(w => lower.includes(w))) improvement.push(rule.key);
  });

  return { positive, improvement };
}
