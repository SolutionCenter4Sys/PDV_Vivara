/**
 * Mocks adicionais para features MVP que não estavam no mocks original.
 * Mantém isolado para não inflar o arquivo principal.
 */

export interface StoreLocation {
  id: string;
  name: string;
  city: string;
  uf: string;
  distanceKm: number;
  stockUnits: number;
  reserveTimeMinutes: number;
  shipFromStoreSlaH: number;
  /** EP-02-F1 · `cd` indica Centro de Distribuição (sem chão de loja) */
  type?: 'store' | 'cd';
}

/**
 * EP-02-F1 · Estoque unificado em outras lojas (mock por SKU)
 * Em produção viria de SAP S/4HANA + Pricefx Inventory Service.
 */
export const storesByDistance: StoreLocation[] = [
  {
    id: 'IT-MORUMBI',
    name: 'Vivara Morumbi',
    city: 'São Paulo',
    uf: 'SP',
    distanceKm: 0,
    stockUnits: 6,
    reserveTimeMinutes: 0,
    shipFromStoreSlaH: 0,
    type: 'store',
  },
  {
    id: 'IT-IGUATEMI',
    name: 'Vivara Iguatemi SP',
    city: 'São Paulo',
    uf: 'SP',
    distanceKm: 4.2,
    stockUnits: 3,
    reserveTimeMinutes: 30,
    shipFromStoreSlaH: 4,
    type: 'store',
  },
  {
    id: 'IT-VILLA-LOBOS',
    name: 'Vivara Villa-Lobos',
    city: 'São Paulo',
    uf: 'SP',
    distanceKm: 5.7,
    stockUnits: 2,
    reserveTimeMinutes: 30,
    shipFromStoreSlaH: 4,
    type: 'store',
  },
  {
    id: 'IT-JK',
    name: 'Vivara Shopping JK',
    city: 'São Paulo',
    uf: 'SP',
    distanceKm: 7.1,
    stockUnits: 1,
    reserveTimeMinutes: 45,
    shipFromStoreSlaH: 4,
    type: 'store',
  },
  {
    id: 'IT-CIDADE-JARDIM',
    name: 'Vivara Cidade Jardim',
    city: 'São Paulo',
    uf: 'SP',
    distanceKm: 9.4,
    stockUnits: 4,
    reserveTimeMinutes: 60,
    shipFromStoreSlaH: 8,
    type: 'store',
  },
  {
    id: 'IT-IBIRAPUERA',
    name: 'Vivara Shopping Ibirapuera',
    city: 'São Paulo',
    uf: 'SP',
    distanceKm: 11.8,
    stockUnits: 2,
    reserveTimeMinutes: 60,
    shipFromStoreSlaH: 8,
    type: 'store',
  },
  {
    id: 'IT-CAMPINAS',
    name: 'Vivara Iguatemi Campinas',
    city: 'Campinas',
    uf: 'SP',
    distanceKm: 95,
    stockUnits: 5,
    reserveTimeMinutes: 240,
    shipFromStoreSlaH: 24,
    type: 'store',
  },
  {
    id: 'IT-CD-MANAUS',
    name: 'CD Vivara · Manaus',
    city: 'Manaus',
    uf: 'AM',
    distanceKm: 3870,
    stockUnits: 22,
    reserveTimeMinutes: 0,
    shipFromStoreSlaH: 48,
    type: 'cd',
  },
  {
    id: 'IT-CD-EXT',
    name: 'CD Vivara · Extrema',
    city: 'Extrema',
    uf: 'MG',
    distanceKm: 110,
    stockUnits: 18,
    reserveTimeMinutes: 0,
    shipFromStoreSlaH: 24,
    type: 'cd',
  },
];

/**
 * EP-03-F1 · Visão 360 · Timeline de interações cross-channel
 */
export interface CustomerInteraction {
  id: string;
  customerId: string;
  channel: 'pdv' | 'ecommerce' | 'whatsapp' | 'app' | 'sac' | 'instagram';
  type: 'compra' | 'visita' | 'mensagem' | 'wishlist' | 'devolucao' | 'evento' | 'os';
  title: string;
  description: string;
  at: string; // ISO
  storeId?: string;
  amount?: number;
}

export const customerInteractions: CustomerInteraction[] = [
  {
    id: 'INT-001',
    customerId: 'CL-001',
    channel: 'whatsapp',
    type: 'mensagem',
    title: 'Pré-anúncio coleção Diamond',
    description: 'Cliente clicou no link do lookbook · 02:14 de leitura · sem reply.',
    at: '2026-04-30T14:22:00Z',
  },
  {
    id: 'INT-002',
    customerId: 'CL-001',
    channel: 'ecommerce',
    type: 'visita',
    title: 'Visitou aliança Eternity 18k',
    description: 'Adicionou ao carrinho · não finalizou · LI-05 sugere oferta personalizada.',
    at: '2026-05-02T10:08:00Z',
  },
  {
    id: 'INT-003',
    customerId: 'CL-001',
    channel: 'pdv',
    type: 'compra',
    title: 'Compra · Vivara Morumbi',
    description: 'Solitário ouro 18k · R$ 4.890 · vendedora Beatriz · NFC-e emitida.',
    at: '2026-05-04T16:42:00Z',
    storeId: 'IT-MORUMBI',
    amount: 4890,
  },
  {
    id: 'INT-004',
    customerId: 'CL-001',
    channel: 'instagram',
    type: 'visita',
    title: 'Story · pingente Life Kids',
    description: 'Salvou story por 24h · indica intenção de presente.',
    at: '2026-05-05T19:01:00Z',
  },
  {
    id: 'INT-005',
    customerId: 'CL-001',
    channel: 'app',
    type: 'wishlist',
    title: 'Adicionou à wishlist · brincos pérola',
    description: 'Sinal de combinação com solitário (LI-05 antecipatório).',
    at: '2026-05-06T08:34:00Z',
  },
  {
    id: 'INT-006',
    customerId: 'CL-001',
    channel: 'pdv',
    type: 'visita',
    title: 'Entrou na loja · agora',
    description: 'Beacon Bluetooth · TTS LI-01 disparou nudge VIP arrived.',
    at: new Date().toISOString(),
    storeId: 'IT-MORUMBI',
  },
  {
    id: 'INT-007',
    customerId: 'CL-011',
    channel: 'app',
    type: 'wishlist',
    title: 'Wishlist · colar de pérolas',
    description: 'Adicionou peça premium após campanha de Dia das Mães · propensão alta para presente.',
    at: '2026-05-08T21:10:00Z',
  },
  {
    id: 'INT-008',
    customerId: 'CL-011',
    channel: 'pdv',
    type: 'compra',
    title: 'Compra recente · Vivara Iguatemi',
    description: 'Colar de pérolas + brinco Una · R$ 13.940 · recomendação LI-05 aceita.',
    at: '2026-05-09T12:20:00Z',
    storeId: 'IT-IGUATEMI',
    amount: 13940,
  },
  {
    id: 'INT-009',
    customerId: 'CL-015',
    channel: 'pdv',
    type: 'visita',
    title: 'Primeira visita identificada',
    description: 'Cliente novo informou intenção de presente · opt-in WhatsApp e LI capturado no atendimento.',
    at: new Date().toISOString(),
    storeId: 'IT-IGUATEMI',
  },
  {
    id: 'INT-010',
    customerId: 'CL-014',
    channel: 'ecommerce',
    type: 'devolucao',
    title: 'Pedido online elegível para troca',
    description: 'Compra e-commerce ORD-ECOM-2026-8821 dentro do prazo · troca cross-channel disponível em loja.',
    at: '2026-05-09T09:35:00Z',
    amount: 5890,
  },
];

/**
 * EP-03-F2 · Identidades cross-channel a serem mescladas
 */
export interface CandidateIdentity {
  id: string;
  source: 'ecommerce' | 'app' | 'sac' | 'whatsapp';
  email?: string;
  phone?: string;
  cpf?: string;
  totalOrders: number;
  totalLTV: number;
  lastSeenAt: string;
  matchScore: number;
  matchSignals: string[];
}

export const candidateIdentities: CandidateIdentity[] = [
  {
    id: 'ID-EC-77231',
    source: 'ecommerce',
    email: 'maria.almeida@gmail.com',
    cpf: '231.456.789-01',
    totalOrders: 4,
    totalLTV: 12_840,
    lastSeenAt: '2026-04-30T14:22:00Z',
    matchScore: 0.96,
    matchSignals: ['CPF idêntico', 'mesmo dispositivo iOS · fingerprint match'],
  },
  {
    id: 'ID-APP-3211',
    source: 'app',
    email: 'maria.a@hotmail.com',
    phone: '+55 11 9 9999-1234',
    totalOrders: 1,
    totalLTV: 320,
    lastSeenAt: '2026-05-06T08:34:00Z',
    matchScore: 0.78,
    matchSignals: ['Telefone idêntico', 'localização Morumbi/SP'],
  },
  {
    id: 'ID-WA-1112',
    source: 'whatsapp',
    phone: '+55 11 9 9999-1234',
    totalOrders: 0,
    totalLTV: 0,
    lastSeenAt: '2026-05-05T19:01:00Z',
    matchScore: 0.71,
    matchSignals: ['Telefone idêntico', 'opt-in WhatsApp 1:1 ativo'],
  },
];

/** EP-03-F4 · Programa fidelidade Vivara */
export interface LoyaltyAccount {
  customerId: string;
  points: number;
  tierProgress: number; // 0–1 até próximo tier
  nextTier?: 'gold' | 'diamond';
  expiresAt: string; // ISO
}

export const loyaltyAccounts: Record<string, LoyaltyAccount> = {
  'CL-001': {
    customerId: 'CL-001',
    points: 4_280,
    tierProgress: 0.74,
    nextTier: 'diamond',
    expiresAt: '2026-12-31T23:59:00Z',
  },
  'CL-002': {
    customerId: 'CL-002',
    points: 1_120,
    tierProgress: 0.32,
    nextTier: 'gold',
    expiresAt: '2026-12-31T23:59:00Z',
  },
  'CL-011': {
    customerId: 'CL-011',
    points: 6_840,
    tierProgress: 0.91,
    expiresAt: '2026-12-31T23:59:00Z',
  },
  'CL-014': {
    customerId: 'CL-014',
    points: 2_950,
    tierProgress: 0.58,
    nextTier: 'diamond',
    expiresAt: '2026-12-31T23:59:00Z',
  },
  'CL-015': {
    customerId: 'CL-015',
    points: 500,
    tierProgress: 0.08,
    nextTier: 'gold',
    expiresAt: '2026-12-31T23:59:00Z',
  },
};

/** Conversão pontos → R$ (mock · 1 ponto = R$ 0,02) */
export const POINT_TO_BRL = 0.02;
