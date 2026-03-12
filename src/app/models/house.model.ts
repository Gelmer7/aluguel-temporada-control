// src/app/models/house.model.ts

/**
 * Interface principal para a entidade Casa
 * Segue o padrão híbrido: colunas relacionais + metadados JSONB
 */
export interface House {
  id?: string;          // UUID (Supabase generated)
  code: string;         // Identificador único (ex: 'CASA_47')
  name: string;         // Nome da casa
  address?: string;     // Endereço físico
  status: HouseStatus;
  created_by?: string;  // UUID do criador (para RLS)
  content: HouseContent;
  pricing: HousePricing;
  check_info: CheckInfo;
  created_at?: string;
  updated_at?: string;
}

export type HouseStatus = 'active' | 'inactive' | 'draft';

/**
 * Metadados sobre a estrutura e conteúdo da casa
 */
export interface HouseContent {
  property_title: string;
  description: string;
  guests_max: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];        // Lista de comodidades
  safety_features: string[];  // Recursos de segurança
  house_rules: HouseRules;
  cancellation_policy: string;
  location_details?: {
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export interface HouseRules {
  pets_allowed: boolean;
  smoking_allowed: boolean;
  quiet_hours: string;
  additional_rules: string;
}

/**
 * Estrutura de preços e limites de reserva
 */
export interface HousePricing {
  base_night: number;
  weekend_night: number;
  currency: string;           // Ex: 'BRL'
  discounts: {
    weekly_7_nights: number;   // Percentual de desconto
    monthly_28_nights: number; // Percentual de desconto
  };
  stay_limits: {
    min_nights: number;
    max_nights: number;
  };
}

/**
 * Informações logísticas e sensíveis
 */
export interface CheckInfo {
  checkin_method: 'self_checkin' | 'meet_host' | 'lockbox';
  wifi_name: string;
  wifi_password?: string;
  arrival_instructions: string;
  checkout_instructions: string;
  how_to_get_there: string;
}

/**
 * Entidade para gestão de fotos
 */
export interface HousePhoto {
  id?: string;
  house_code: string;
  url: string;
  is_cover: boolean;
  sort_order: number;
  created_at?: string;
}
