// Tipos do domínio · Novo PDV Vivara

export type Brand = 'vivara' | 'life';

export type ProductCategory =
  | 'aneis'
  | 'colares'
  | 'brincos'
  | 'pulseiras'
  | 'aliancas'
  | 'relogios'
  | 'pingentes'
  | 'kids';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: Brand;
  category: ProductCategory;
  collection?: string;
  price: number;
  oldPrice?: number;
  description: string;
  // Atributos joalheria (EP-04-F2)
  weightG: number; // peso em gramas
  goldKarat?: number; // 18, 14, 10
  metal: string; // ouro amarelo 18k, ouro branco, prata 925
  stones?: string;
  hasCertificate: boolean;
  warranty: string; // ex: "Garantia vitalícia"
  // Estoque
  stockLocal: number;
  stockNetwork: number;
  // Imagem · CDN oficial Vivara
  imageUrl: string;
  imageAlt?: string;
  tag?: 'novo' | 'limitada' | 'bestseller';
}

export type CustomerTier = 'diamond' | 'gold' | 'silver' | 'standard';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  tier: CustomerTier;
  birthday?: string; // ISO
  totalLTV: number;
  lastPurchaseISO: string;
  totalOrders: number;
  preferences: string[];
  wishlist: string[]; // ids de produtos
  optInWhatsapp: boolean;
  optInLI: boolean; // Living Intelligence
  city: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customDiscountPct?: number; // EP-05-F7 LI-09 Pricing
}

export type PaymentMethod =
  | 'credit'
  | 'debit'
  | 'pix'
  | 'apple_pay'
  | 'google_pay'
  | 'crediario'
  | 'cash';

export interface Order {
  id: string;
  customer?: Customer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  installments?: number;
  storeId: string;
  sellerId: string;
  brand: Brand;
  createdAt: string; // ISO
  status: 'pending' | 'paid' | 'cancelled';
  fiscal: {
    chave?: string;
    qrCode?: string;
    issued: boolean;
    contingencyMode: boolean;
  };
}

export interface ServiceOrder {
  id: string;
  customer: Customer;
  productSku: string;
  productName: string;
  type: 'reparo' | 'gravacao' | 'polimento' | 'redimensionamento';
  status: 'recebido' | 'cotacao' | 'em_servico' | 'pronto' | 'entregue';
  estimatedPrice?: number;
  estimatedDays: number;
  defectClassification?: string; // LI-07
  upsellSuggestion?: string;
  receivedAt: string;
}

export interface Seller {
  id: string;
  name: string;
  pin: string;
  storeId: string;
  storeName: string;
  brand: Brand;
  trainingScore: number;
  monthSales: number;
  monthAOV: number;
  monthConversion: number;
  /** Populado via MSAL quando login SSO ativo · ex: bia.almeida@vivara.com.br */
  email?: string;
}

export type ConnectivityStatus = 'online' | 'offline' | 'fault';

// Living Intelligence · Agente IA multi-agente
//
// Cada `type` mapeia para um papel distinto do Agente IA exposto ao vendedor.
// Mapeamento (ver pitch executivo May/26):
//   vip-arrived       → CDP Sentinel · cliente Diamond entrou no salão
//   wishlist-match    → Wishlist Engine · peça da wishlist liberada / em estoque local
//   birthday          → Clienteling Antecipatório · janela de aniversário/marco
//   combination       → Estilo IA · combinação curatorial de mesma família
//   cross-sell        → Sacola Inteligente · cross-sell contextual em tempo real
//   risk              → Sentinela de Risco · churn / antifraude / no-show
//   intent-prediction → Visão 360° · agente sussurra a próxima ação certa
//   vitrine-trigger   → Vitrine Inteligente Adaptativa · perfil reconhecido na vitrine
//   bundle-suggestion → Sacola Inteligente · bundle de margem otimizada (peça + serviço)
//   identity-merge    → Cross-Channel Unifier · identidade unificada em segundos
export type CopilotNudgeType =
  | 'vip-arrived'
  | 'wishlist-match'
  | 'birthday'
  | 'combination'
  | 'cross-sell'
  | 'risk'
  | 'intent-prediction'
  | 'vitrine-trigger'
  | 'bundle-suggestion'
  | 'identity-merge';

export interface CopilotNudge {
  id: string;
  type: CopilotNudgeType;
  customerId?: string;
  productSku?: string;
  title: string;
  body: string;
  urgency: 'normal' | 'high';
  margin?: 'optimal' | 'good' | 'attention';
  /** Nome do papel/agente detector exibido no card (ex. "Vitrine Vision", "Sacola Engine"). */
  agentRole?: string;
  /** Oportunidade financeira (R$) explícita; quando ausente é inferida via estimateOpportunity. */
  valueHint?: number;
  createdAt: string;
}

export interface KPI {
  label: string;
  value: number | string;
  delta?: string;
  format?: 'currency' | 'percent' | 'number';
  trend?: 'up' | 'down' | 'neutral';
}
