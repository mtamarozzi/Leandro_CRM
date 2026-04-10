import { Lead, Property, Event } from './types';

export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    email: 'carlos@email.com',
    phone: '11987654321',
    status: 'Em Contato',
    interest: 'Apartamento 2 dorms',
    valueRange: 'R$ 300.000 - R$ 400.000',
    region: 'Zona Sul',
    lastContact: '2026-04-08',
    notes: 'Cliente procura imóvel próximo ao metrô. Tem urgência.',
    source: 'Google'
  },
  {
    id: '2',
    name: 'Ana Paula Santos',
    email: 'ana.santos@email.com',
    phone: '11976543210',
    status: 'Visita Agendada',
    interest: 'Studio',
    valueRange: 'R$ 200.000 - R$ 300.000',
    region: 'Centro',
    lastContact: '2026-04-09',
    notes: 'Indicação da Maria. Primeira compra, precisa de orientação sobre financiamento.',
    source: 'Indicação'
  },
  {
    id: '3',
    name: 'Roberto Oliveira',
    email: 'roberto.o@email.com',
    phone: '11965432109',
    status: 'Proposta',
    interest: 'Apartamento 3 dorms',
    valueRange: 'R$ 500.000 - R$ 700.000',
    region: 'Zona Oeste',
    lastContact: '2026-04-10',
    notes: 'Interessado no empreendimento Vista Park. Aguardando análise de crédito.',
    source: 'Instagram'
  },
  {
    id: '4',
    name: 'Juliana Costa',
    email: 'ju.costa@email.com',
    phone: '11954321098',
    status: 'Novo',
    interest: 'Cobertura',
    valueRange: 'Acima de R$ 1.000.000',
    region: 'Zona Sul',
    lastContact: '2026-04-10',
    notes: '',
    source: 'Facebook'
  },
  {
    id: '5',
    name: 'Pedro Henrique',
    email: 'pedro@email.com',
    phone: '11943210987',
    status: 'Em Contato',
    interest: 'Apartamento 2 dorms',
    valueRange: 'R$ 350.000 - R$ 450.000',
    region: 'Zona Leste',
    lastContact: '2026-04-07',
    notes: 'Quer visitar no final de semana',
    source: 'WhatsApp'
  },
  {
    id: '6',
    name: 'Marina Rodrigues',
    email: 'marina.r@email.com',
    phone: '11932109876',
    status: 'Perdido',
    interest: 'Apartamento 1 dorm',
    valueRange: 'R$ 250.000 - R$ 350.000',
    region: 'Centro',
    lastContact: '2026-03-11',
    notes: 'Desistiu da compra, vai aguardar mais 6 meses',
    source: 'Tráfego pago'
  }
];

export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Vista Park Residence',
    developer: 'Construtora Excellence',
    status: 'Em Obras',
    region: 'Zona Oeste - Pinheiros',
    priceRange: 'R$ 450.000 - R$ 850.000',
    units: 'Studio, 1 e 2 dorms',
    description: 'Empreendimento moderno com área de lazer completa, academia, piscina e coworking.',
    isFeatured: true
  },
  {
    id: '2',
    name: 'Jardim das Flores',
    developer: 'Urban Construções',
    status: 'Lançamento',
    region: 'Zona Sul - Vila Mariana',
    priceRange: 'R$ 550.000 - R$ 1.200.000',
    units: '2 e 3 dorms',
    description: 'Localização privilegiada próximo ao metrô, com acabamento de alto padrão.',
    isFeatured: true
  },
  {
    id: '3',
    name: 'Residencial Harmonia',
    developer: 'Construtora Palmeiras',
    status: 'Pronto',
    region: 'Zona Leste - Tatuapé',
    priceRange: 'R$ 280.000 - R$ 450.000',
    units: '2 e 3 dorms',
    description: 'Ótimo custo-benefício, com playground e salão de festas.',
    isFeatured: false
  }
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Follow-up - Carlos',
    date: '2026-04-11',
    time: '10:30',
    type: 'Follow-up',
    leadId: '1',
    notes: 'Verificar se ele conseguiu os documentos'
  },
  {
    id: '2',
    title: 'Visita - Ana Paula',
    date: '2026-04-12',
    time: '14:00',
    type: 'Visita',
    leadId: '2',
    propertyId: '1',
    notes: 'Visita agendada para às 14h'
  },
  {
    id: '3',
    title: 'Reunião - Roberto (proposta)',
    date: '2026-04-13',
    time: '16:00',
    type: 'Reunião',
    leadId: '3',
    notes: 'Apresentar proposta final'
  }
];
