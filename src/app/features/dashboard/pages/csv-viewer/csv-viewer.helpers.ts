import { AirbnbNormalizedRow, AirbnbHeaderToKey } from '../../../../models/airbnb.model';
import { AppColors } from '../../../../shared/design/colors';

export type ViewerRow = { __id: number; __raw?: Record<string, string>; __norm: AirbnbNormalizedRow };

export function isDerived(field: string, inicioFimField: string, pessoaField: string): boolean {
  return field === inicioFimField || field === pessoaField;
}

export function isPessoa(field: string, pessoaField: string): boolean {
  return field === pessoaField;
}

export function personFromTipo(tipo: string): string {
  const t = (tipo ?? '').trim();
  return t === 'Reserva' ? 'Luiza' : t === 'Recebimento do coanfitrião' ? 'Gelmer' : t === 'Pagamento da Resolução' ? 'Luiza' : '';
}

export function renderDerived(row: ViewerRow, field: string, inicioFimField: string, pessoaField: string): string {
  if (field === inicioFimField) {
    const ini = row.__norm.dataInicio ?? '';
    const fim = row.__norm.dataTermino ?? '';
    
    // Função interna simples para formatar MM/DD/YYYY para DD/MM/YYYY
    const format = (d: string) => {
      const p = d.split('/');
      return p.length === 3 ? `${p[1].padStart(2, '0')}/${p[0].padStart(2, '0')}/${p[2]}` : d;
    };
    
    return `${format(ini)} - ${format(fim)}`;
  }
  if (field === pessoaField) {
    return personFromTipo(row.__norm.tipo);
  }
  return '';
}

export function getCellValue(row: ViewerRow, field: string): string {
  const normKey = AirbnbHeaderToKey[field as keyof typeof AirbnbHeaderToKey];
  if (normKey && row.__norm) return row.__norm[normKey] as string;
  const raw = row.__raw;
  return raw ? raw[field] ?? '' : '';
}

export function colTooltip(row: ViewerRow, field: string, inicioFimField: string, pessoaField: string): string {
  if (isDerived(field, inicioFimField, pessoaField)) {
    if (isPessoa(field, pessoaField)) return personFromTipo(row.__norm.tipo);
    const ini = row.__norm.dataInicio ?? '';
    const fim = row.__norm.dataTermino ?? '';
    return `${ini} - ${fim}`.trim();
  }
  const v = getCellValue(row, field);
  return String(v ?? '');
}

export function tipoHighlight(row: ViewerRow): string | undefined {
  const tipo = (row.__norm.tipo ?? '').trim();
  return tipo === 'Recebimento do coanfitrião' ? AppColors.coHost : tipo === 'Reserva' ? AppColors.host : tipo === 'Pagamento da Resolução' ? AppColors.damage : undefined;
}