export interface AirbnbRow {
  "Data": string;
  "Disponível por data": string;
  "Tipo": string;
  "Código de Confirmação": string;
  "Data da reserva": string;
  "Data de início": string;
  "Data de término": string;
  "Noites": string;
  "Hóspede": string;
  "Anúncio": string;
  "Informações": string;
  "Código de referência": string;
  "Moeda": string;
  "Valor": string;
  "Pago": string;
  "Taxa de serviço": string;
  "Taxa de pagamento rápido": string;
  "Taxa de limpeza": string;
  "Ganhos brutos": string;
  "Impostos de ocupação": string;
  "Ganhos do ano": string;
}

export type AirbnbHeaderKey = keyof AirbnbRow;

export interface AirbnbNormalizedRow {
  data: string;
  disponivelPorData: string;
  tipo: string;
  codigoConfirmacao: string;
  dataReserva: string;
  dataInicio: string;
  dataTermino: string;
  noites: string;
  hospede: string;
  anuncio: string;
  informacoes: string;
  codigoReferencia: string;
  moeda: string;
  valor: string;
  pago: string;
  taxaServico: string;
  taxaPagamentoRapido: string;
  taxaLimpeza: string;
  ganhosBrutos: string;
  impostosOcupacao: string;
  ganhosAno: string;
  house_code?: string;
  createUser?: string;
}

export const AirbnbHeaderToKey: Record<AirbnbHeaderKey, keyof AirbnbNormalizedRow> = {
  "Data": "data",
  "Disponível por data": "disponivelPorData",
  "Tipo": "tipo",
  "Código de Confirmação": "codigoConfirmacao",
  "Data da reserva": "dataReserva",
  "Data de início": "dataInicio",
  "Data de término": "dataTermino",
  "Noites": "noites",
  "Hóspede": "hospede",
  "Anúncio": "anuncio",
  "Informações": "informacoes",
  "Código de referência": "codigoReferencia",
  "Moeda": "moeda",
  "Valor": "valor",
  "Pago": "pago",
  "Taxa de serviço": "taxaServico",
  "Taxa de pagamento rápido": "taxaPagamentoRapido",
  "Taxa de limpeza": "taxaLimpeza",
  "Ganhos brutos": "ganhosBrutos",
  "Impostos de ocupação": "impostosOcupacao",
  "Ganhos do ano": "ganhosAno",
};

export const AirbnbKeyToHeader: Partial<Record<keyof AirbnbNormalizedRow, AirbnbHeaderKey>> = {
  data: "Data",
  disponivelPorData: "Disponível por data",
  tipo: "Tipo",
  codigoConfirmacao: "Código de Confirmação",
  dataReserva: "Data da reserva",
  dataInicio: "Data de início",
  dataTermino: "Data de término",
  noites: "Noites",
  hospede: "Hóspede",
  anuncio: "Anúncio",
  informacoes: "Informações",
  codigoReferencia: "Código de referência",
  moeda: "Moeda",
  valor: "Valor",
  pago: "Pago",
  taxaServico: "Taxa de serviço",
  taxaPagamentoRapido: "Taxa de pagamento rápido",
  taxaLimpeza: "Taxa de limpeza",
  ganhosBrutos: "Ganhos brutos",
  impostosOcupacao: "Impostos de ocupação",
  ganhosAno: "Ganhos do ano",
};

export function normalizeAirbnbRow(input: Partial<AirbnbRow>): AirbnbNormalizedRow {
  return {
    data: String(input["Data"] ?? ""),
    disponivelPorData: String(input["Disponível por data"] ?? ""),
    tipo: String(input["Tipo"] ?? ""),
    codigoConfirmacao: String(input["Código de Confirmação"] ?? ""),
    dataReserva: String(input["Data da reserva"] ?? ""),
    dataInicio: String(input["Data de início"] ?? ""),
    dataTermino: String(input["Data de término"] ?? ""),
    noites: String(input["Noites"] ?? ""),
    hospede: String(input["Hóspede"] ?? ""),
    anuncio: String(input["Anúncio"] ?? ""),
    informacoes: String(input["Informações"] ?? ""),
    codigoReferencia: String(input["Código de referência"] ?? ""),
    moeda: String(input["Moeda"] ?? ""),
    valor: String(input["Valor"] ?? ""),
    pago: String(input["Pago"] ?? ""),
    taxaServico: String(input["Taxa de serviço"] ?? ""),
    taxaPagamentoRapido: String(input["Taxa de pagamento rápido"] ?? ""),
    taxaLimpeza: String(input["Taxa de limpeza"] ?? ""),
    ganhosBrutos: String(input["Ganhos brutos"] ?? ""),
    impostosOcupacao: String(input["Impostos de ocupação"] ?? ""),
    ganhosAno: String(input["Ganhos do ano"] ?? ""),
  };
}