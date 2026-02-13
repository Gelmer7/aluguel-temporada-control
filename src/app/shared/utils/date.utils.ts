
/**
 * Utilitário global para manipulação de datas.
 */
export class DateUtils {
  /**
   * Converte uma data para uma string ISO preservando o fuso horário local (com offset).
   * Exemplo para o Brasil (UTC-3): 2026-02-11T18:23:00.000-03:00
   * 
   * Isso evita que a data "pule" para o dia seguinte quando salva tarde da noite
   * e garante que o horário salvo corresponda ao horário real do usuário.
   */
  static toLocalISOString(date: Date | string | null | undefined): string {
    if (!date) return new Date().toISOString();
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Se a data for inválida, retorna o ISO padrão
    if (isNaN(d.getTime())) return new Date().toISOString();

    const tzo = -d.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const ms = (d.getMilliseconds() / 1000).toFixed(3).slice(2, 5);
    const timezoneHours = pad(Math.floor(Math.abs(tzo) / 60));
    const timezoneMinutes = pad(Math.abs(tzo) % 60);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${dif}${timezoneHours}:${timezoneMinutes}`;
  }

  /**
   * Retorna apenas a parte da data (YYYY-MM-DD) de forma segura para o fuso horário local.
   */
  static toDateString(date: Date | string | null | undefined): string {
    if (!date) return new Date().toISOString().split('T')[0];
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /**
   * Cria um objeto Date a partir de uma string ISO (YYYY-MM-DD) tratando-a como hora local
   * em vez de UTC, evitando problemas de fuso horário.
   */
  static parseLocal(dateStr: string | null | undefined): Date {
    if (!dateStr) return new Date();
    
    // Se for uma string de data pura (YYYY-MM-DD), forçamos a interpretação local
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    // Se for data/hora sem timezone, o JS já interpreta como local
    // Se tiver 'Z' ou offset, o JS interpreta corretamente como UTC/Offset
    return new Date(dateStr);
  }
}
