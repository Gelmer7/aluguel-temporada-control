export interface AirbnbReview {
  // Metadados
  id?: number;
  reviewId: string; // ID original do Airbnb (id)
  reservationCode: string; // Vínculo com a reserva (Codigo de reserva)
  guestName: string; // nomeHospede
  reviewUrl: string; // url
  createdAt?: Date;
  houseCode?: string;

  // Avaliação Geral (avaliacaoGeral)
  overallRating: number; // estrelasAvaliacaoGeral
  publicComment: string; // avaliacaoPublica
  hostResponse?: string; // suaRespostaPublica
  privateFeedback?: string; // mensagemPrivada

  // Feedback Detalhado (feedbackDetalhado)
  cleanlinessRating?: number; // limpeza
  checkinRating?: number; // checkIn
  communicationRating?: number; // comunicacao
  locationRating?: number; // localizacao
  valueRating?: number; // custoBeneficio
}

// Interface auxiliar para mapear diretamente do JSON se necessário
export interface AirbnbReviewJSON {
  avaliacaoGeral: {
    estrelasAvaliacaoGeral: number;
    avaliacaoPublica: string;
    suaRespostaPublica: string;
    mensagemPrivada: string;
  };
  feedbackDetalhado: {
    limpeza: number;
    checkIn: number;
    comunicacao: number;
    localizacao: number;
    custoBeneficio: number;
  };
  nomeHospede: string;
  url: string;
  id: string;
}
