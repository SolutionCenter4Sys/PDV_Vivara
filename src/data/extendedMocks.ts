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

// =====================
// VITRINE INTELIGENTE ADAPTATIVA · Agente IA (Vitrine Vision)
// =====================
//
// Em produção: câmera 4K + modelo de visão computacional rodando edge
// (Jetson Orin) que classifica perfil sociodemográfico (idade, gênero,
// composição de grupo, dwell-time) sem armazenar imagem nem PII.
// LGPD-by-design: somente embeddings agregados saem do device.
//
// O modelo dispara uma TROCA da peça em destaque na vitrine digital quando
// a confiança ultrapassa 0.65 e a peça candidata tem probabilidade superior
// de captura para aquele perfil (Look-alike model treinado em conversão histórica).

export interface VitrineProfile {
  id: string;
  /** Faixa etária estimada. */
  ageRange: '18-24' | '25-34' | '35-44' | '45-54' | '55+';
  /** Composição do grupo detectado. */
  groupKind: 'solo-feminino' | 'solo-masculino' | 'casal-jovem' | 'casal-maduro' | 'familia' | 'amigas';
  /** Confiança do classificador (0-1). */
  confidence: number;
}

export interface VitrineEvent {
  id: string;
  ts: string; // ISO
  /** Tempo de permanência detectado em segundos antes da troca. */
  dwellSec: number;
  profile: VitrineProfile;
  /** SKU exibido ANTES da adaptação. */
  fromSku: string;
  /** SKU em destaque APÓS adaptação. */
  toSku: string;
  /** Motivo curto que aparece no log. */
  rationale: string;
  /** True se levou a entrada na loja em até 60s (proxy de captura). */
  capturedEntry: boolean;
  /** True se levou a venda na sessão (latência <30min). */
  capturedSale: boolean;
}

export interface VitrineKpis {
  /** Captura média semanal · % de pessoas que entram após dwell em vitrine adaptativa. */
  captureRateWeekly: number;
  /** Mesma métrica em vitrines ESTÁTICAS (controle). */
  captureRateBaseline: number;
  /** Eventos / hora · ritmo de adaptação. */
  adaptationsPerHour: number;
  /** Tempo médio de troca de destaque (ms). */
  swapLatencyMs: number;
  /** % de eventos que terminam em venda na mesma sessão. */
  sessionConversion: number;
  /** Confiança média do classificador. */
  modelConfidence: number;
}

/**
 * KPIs semanais agregados da vitrine adaptativa (mock realista, alinhado
 * ao posicionamento do pitch: +% de taxa de captura).
 */
export const vitrineKpis: VitrineKpis = {
  captureRateWeekly: 0.184,        // 18,4%
  captureRateBaseline: 0.094,      // 9,4% controle
  adaptationsPerHour: 47,
  swapLatencyMs: 280,
  sessionConversion: 0.276,        // 27,6%
  modelConfidence: 0.81,
};

/**
 * Stream de eventos recentes da vitrine (últimos minutos).
 * Cada evento referencia SKUs reais do catálogo para gerar imagem viva.
 */
export const vitrineEvents: VitrineEvent[] = [
  {
    id: 'VTR-001',
    ts: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    dwellSec: 14,
    profile: { id: 'P1', ageRange: '25-34', groupKind: 'casal-jovem', confidence: 0.87 },
    fromSku: 'BR00081234',
    toSku: 'AN00055910',
    rationale: 'Casal pré-noivado · troca para Solitário Forever · histórico mostra +34% captura.',
    capturedEntry: true,
    capturedSale: false,
  },
  {
    id: 'VTR-002',
    ts: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    dwellSec: 9,
    profile: { id: 'P2', ageRange: '35-44', groupKind: 'amigas', confidence: 0.72 },
    fromSku: 'AN00055910',
    toSku: 'BR00081567',
    rationale: 'Grupo de amigas · destaque para brincos statement (impulso entre pares).',
    capturedEntry: true,
    capturedSale: true,
  },
  {
    id: 'VTR-003',
    ts: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    dwellSec: 22,
    profile: { id: 'P3', ageRange: '45-54', groupKind: 'casal-maduro', confidence: 0.91 },
    fromSku: 'BR00081567',
    toSku: 'CO00023616',
    rationale: 'Casal maduro · troca para colar Orbis Pérolas (dwell longo · alto engajamento).',
    capturedEntry: false,
    capturedSale: false,
  },
  {
    id: 'VTR-004',
    ts: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    dwellSec: 6,
    profile: { id: 'P4', ageRange: '18-24', groupKind: 'solo-feminino', confidence: 0.68 },
    fromSku: 'CO00023616',
    toSku: 'BR00081234',
    rationale: 'Cliente jovem solo · troca para entrada de coleção · ticket compatível.',
    capturedEntry: true,
    capturedSale: false,
  },
  {
    id: 'VTR-005',
    ts: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    dwellSec: 18,
    profile: { id: 'P5', ageRange: '25-34', groupKind: 'familia', confidence: 0.79 },
    fromSku: 'BR00081234',
    toSku: 'BE00051920',
    rationale: 'Família com criança detectada · destaque para Pingente Menino (linha Mama).',
    capturedEntry: true,
    capturedSale: true,
  },
  {
    id: 'VTR-006',
    ts: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    dwellSec: 11,
    profile: { id: 'P6', ageRange: '35-44', groupKind: 'solo-feminino', confidence: 0.83 },
    fromSku: 'BE00051920',
    toSku: 'AN00055910',
    rationale: 'Cliente solo · perfil "autopresente" alto · destaque coleção Happy.',
    capturedEntry: true,
    capturedSale: false,
  },
  {
    id: 'VTR-007',
    ts: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    dwellSec: 8,
    profile: { id: 'P7', ageRange: '55+', groupKind: 'casal-maduro', confidence: 0.86 },
    fromSku: 'AN00055910',
    toSku: 'CO00023616',
    rationale: 'Faixa 55+ · destaque para alta joalheria com pérolas (LTV histórico maior).',
    capturedEntry: false,
    capturedSale: false,
  },
];

/**
 * Top 5 perfis sociodemográficos detectados nas últimas 24h
 * (input para report executivo do gerente).
 */
export const vitrineTopProfiles: Array<{
  groupKind: VitrineProfile['groupKind'];
  ageRange: VitrineProfile['ageRange'];
  count: number;
  conversionRate: number;
}> = [
  { groupKind: 'solo-feminino', ageRange: '25-34', count: 312, conversionRate: 0.31 },
  { groupKind: 'casal-jovem', ageRange: '25-34', count: 187, conversionRate: 0.42 },
  { groupKind: 'amigas', ageRange: '18-24', count: 156, conversionRate: 0.18 },
  { groupKind: 'casal-maduro', ageRange: '45-54', count: 124, conversionRate: 0.36 },
  { groupKind: 'familia', ageRange: '35-44', count: 98, conversionRate: 0.27 },
];
