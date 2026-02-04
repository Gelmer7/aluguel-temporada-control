/**
 * Utilitário global para manipulação de strings com foco em normalização para buscas.
 */
export class StringUtils {
  /**
   * Normaliza uma string removendo acentos, cedilhas e caracteres especiais comuns.
   * Ideal para buscas insensíveis a acentos e caracteres especiais.
   *
   * @param val O valor a ser normalizado (pode ser qualquer tipo, será convertido para string).
   * @returns A string normalizada em minúsculo, sem acentos e caracteres especiais.
   */
  static normalize(val: any): string {
    if (val === null || val === undefined) return '';

    return String(val)
      .toLowerCase()
      .normalize('NFD') // Decompõe caracteres acentuados (ex: 'á' -> 'a' + '´')
      .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos (acentos)
      .replace(/ç/g, 'c') // Trata o cedilha
      .replace(/ø/g, 'o') // Trata o o cortado
      .replace(/æ/g, 'ae') // Trata ligaduras
      .replace(/œ/g, 'oe')
      .replace(/ß/g, 'ss') // Trata o eszett alemão
      .replace(/[^\w\s]/gi, '') // Remove outros caracteres especiais (opcional, dependendo do caso)
      .trim();
  }

  /**
   * Verifica se uma string contém outra, ignorando acentos e maiúsculas/minúsculas.
   */
  static fuzzyIncludes(source: any, search: string): boolean {
    const normalizedSource = this.normalize(source);
    const normalizedSearch = this.normalize(search);
    return normalizedSource.includes(normalizedSearch);
  }
}
