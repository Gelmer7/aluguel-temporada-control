import { AirbnbNormalizedRow } from '../../models/airbnb.model';

/**
 * Utilitário global para cálculos específicos do Airbnb.
 */
export class AirbnbUtils {
  /**
   * Calcula o total de noites e taxa de limpeza de forma agrupada por código de confirmação.
   * Garante que duplicatas no CSV não inflem os resultados.
   * 
   * @param rows Array de linhas normalizadas do Airbnb
   * @returns Objeto contendo os totais de noites e limpeza
   */
  static calculateGroupedTotals(rows: AirbnbNormalizedRow[]): { totalNoites: number; totalLimpeza: number } {
    let totalNoites = 0;
    let totalLimpeza = 0;
    const processedNights = new Set<string>();
    const processedLimpeza = new Set<string>();

    rows.forEach((row) => {
      const confirmationCode = (row.codigoConfirmacao ?? '').trim();
      const noites = this.parseNumber(row.noites);
      const limpeza = this.parseCurrency(row.taxaLimpeza);

      if (confirmationCode) {
        // Noites: soma apenas uma vez por código de confirmação
        if (!processedNights.has(confirmationCode) && noites > 0) {
          totalNoites += noites;
          processedNights.add(confirmationCode);
        }
        // Limpeza: soma apenas uma vez por código de confirmação
        if (!processedLimpeza.has(confirmationCode) && limpeza > 0) {
          totalLimpeza += limpeza;
          processedLimpeza.add(confirmationCode);
        }
      } else {
        // Se não houver código (ajustes/taxas avulsas), soma normalmente
        totalNoites += noites;
        totalLimpeza += limpeza;
      }
    });

    return { totalNoites, totalLimpeza };
  }

  /**
   * Converte string de moeda (BRL/USD) para número.
   */
  static parseCurrency(val: string | undefined): number {
    if (!val) return 0;
    const clean = val.replace(/[^\d,.-]/g, '');
    if (!clean) return 0;

    if (clean.includes(',') && clean.includes('.')) {
      return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    }
    if (clean.includes(',')) {
      return parseFloat(clean.replace(',', '.'));
    }
    return parseFloat(clean);
  }

  /**
   * Converte string numérica para inteiro.
   */
  static parseNumber(val: string | undefined): number {
    if (!val) return 0;
    return parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
  }

  /**
   * Refatora o relatório do Airbnb mesclando linhas de "Payout" com as linhas seguintes.
   * 
   * @param data Array de objetos (linhas do CSV)
   * @returns Array de objetos refatorado
   */
  static processAirbnbReport(data: any[]): any[] {
    const refactoredData: any[] = [];
    const pendingPayouts: any[] = [];

    // Iterar pelas linhas do CSV
    for (const row of data) {
      const rowCopy = { ...row };
      const tipo = (rowCopy['Tipo'] || '').trim();

      if (tipo === 'Payout') {
        pendingPayouts.push(rowCopy);
        continue;
      }

      if (tipo === 'Recebimento do coanfitrião') {
        // Para co-anfitrião: Pago = ABS(Valor)
        const valor = this.parseCurrency(rowCopy['Valor']);
        rowCopy['Pago'] = String(Math.abs(valor));
        refactoredData.push(rowCopy);
        continue;
      }

      // Reserva, Créditos Diversos, Pagamento da Resolução, etc.
      if (pendingPayouts.length > 0) {
        // Pegar o primeiro payout pendente (geralmente o pagamento está ligado à fila seguinte)
        const payout = pendingPayouts.shift();
        
        // Mesclar Tipo
        rowCopy['Tipo'] = `Payout/${tipo}`;
        
        // Mesclar Pago
        rowCopy['Pago'] = payout['Pago'];

        // Mesclar outras colunas se preenchidas no Payout
        Object.keys(payout).forEach(key => {
          if (key === 'Tipo' || key === 'Pago' || key === 'Data' || key === 'Valor') return;
          
          const payoutVal = String(payout[key] || '').trim();
          const rowVal = String(rowCopy[key] || '').trim();
          
          if (payoutVal && payoutVal !== rowVal) {
            if (rowVal) {
              rowCopy[key] = `${payoutVal}/${rowVal}`;
            } else {
              rowCopy[key] = payoutVal;
            }
          }
        });
      }
      
      refactoredData.push(rowCopy);
    }
    
    return refactoredData;
  }
}
