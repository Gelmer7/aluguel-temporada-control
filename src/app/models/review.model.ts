export interface AirbnbReview {
  id?: string;
  reservationCode: string; // Chave de reserva para linkar
  guestName: string;
  guestAvatarUrl?: string;
  submittedAt: Date;
  
  // Comentários
  publicComment: string;
  privateFeedback?: string; // O feedback privado que o hóspede deixa
  
  // Avaliação Estrelas (1-5)
  ratingOverall: number;
  ratingCleanliness?: number;   // Limpeza
  ratingAccuracy?: number;      // Veracidade
  ratingCheckIn?: number;       // Check-in
  ratingCommunication?: number; // Comunicação
  ratingLocation?: number;      // Localização
  ratingValue?: number;         // Custo-benefício
  
  // Tags/Itens específicos mencionados (ex: "Instruções claras", "Lugar impecável")
  positiveFeedbackTags?: string[]; 
  improvementFeedbackTags?: string[];
}
