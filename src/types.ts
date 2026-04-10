export type LeadStatus = 'Novo' | 'Em Contato' | 'Visita Agendada' | 'Proposta' | 'Fechado' | 'Perdido';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  interest: string;
  valueRange: string;
  region: string;
  lastContact: string;
  notes: string;
  source: 'Google' | 'Instagram' | 'Facebook' | 'WhatsApp' | 'Indicação' | 'Tráfego pago';
}

export interface Property {
  id: string;
  name: string;
  developer: string;
  status: 'Lançamento' | 'Em Obras' | 'Pronto';
  region: string;
  priceRange: string;
  units: string;
  description: string;
  isFeatured: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'Follow-up' | 'Visita' | 'Reunião';
  leadId?: string;
  propertyId?: string;
  notes?: string;
}
