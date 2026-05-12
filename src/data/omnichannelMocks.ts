/**
 * Mocks omnichannel · BOPIS, Ship-from-Store, OMS Enterprise.
 *
 * Em produção · Manhattan Active OMS / Salesforce Order Management exposto
 * via iPaaS Digibee como API gateway estabilizada.
 */

export type OrderChannel = 'web' | 'app' | 'whatsapp' | 'pdv' | 'instagram';

export type FulfillmentMode = 'bopis' | 'ship_from_store' | 'ship_from_dc' | 'pickup_curbside';

export type OmsStatus =
  | 'created'
  | 'paid'
  | 'allocated'
  | 'picking'
  | 'packed'
  | 'ready_for_pickup'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface OmsOrderItem {
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface OmsOrder {
  id: string;
  channel: OrderChannel;
  fulfillmentMode: FulfillmentMode;
  status: OmsStatus;
  customerName: string;
  customerCpf: string;
  customerPhone?: string;
  customerEmail?: string;
  storeSlug: string;
  fromStoreSlug?: string;
  destinationCity?: string;
  destinationUf?: string;
  items: OmsOrderItem[];
  totalAmount: number;
  createdAt: string; // ISO
  pickupSlaH?: number; // SLA até estar pronto
  shippingSlaH?: number;
  carrier?: 'correios_pac' | 'correios_sedex' | 'rapiddo' | 'jadlog' | 'loggi' | 'in_house';
  awbCode?: string; // tracking gerado para SFS
  pickupCode?: string; // BOPIS · 4 dígitos para retirada
  notes?: string;
}

export const omsOrders: OmsOrder[] = [
  {
    id: 'OMS-2026-001245',
    channel: 'web',
    fulfillmentMode: 'bopis',
    status: 'ready_for_pickup',
    customerName: 'Beatriz Almeida',
    customerCpf: '123.456.789-00',
    customerPhone: '+55 11 98765-4321',
    customerEmail: 'bia@example.com',
    storeSlug: 'morumbi',
    items: [
      {
        sku: 'AN-LIFE-CRSP',
        productName: 'Anel Coração Cravejado',
        quantity: 1,
        unitPrice: 449,
      },
    ],
    totalAmount: 449,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    pickupSlaH: 4,
    pickupCode: '7281',
  },
  {
    id: 'OMS-2026-001312',
    channel: 'app',
    fulfillmentMode: 'bopis',
    status: 'ready_for_pickup',
    customerName: 'Lucas Henrique Silva',
    customerCpf: '987.654.321-00',
    customerPhone: '+55 11 91234-5678',
    storeSlug: 'morumbi',
    items: [
      {
        sku: 'BR-LIFE-CRWD',
        productName: 'Brincos Crown Diamond',
        quantity: 1,
        unitPrice: 1299,
      },
      {
        sku: 'CL-LIFE-INFY',
        productName: 'Colar Infinity',
        quantity: 1,
        unitPrice: 599,
      },
    ],
    totalAmount: 1898,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    pickupSlaH: 2,
    pickupCode: '4019',
  },
  {
    id: 'OMS-2026-001320',
    channel: 'whatsapp',
    fulfillmentMode: 'bopis',
    status: 'picking',
    customerName: 'Mariana Souza Lopes',
    customerCpf: '456.789.123-00',
    customerPhone: '+55 11 99988-1122',
    storeSlug: 'morumbi',
    items: [
      {
        sku: 'AL-LIFE-GLDT',
        productName: 'Aliança Gold Tradicional',
        quantity: 2,
        unitPrice: 2999,
      },
    ],
    totalAmount: 5998,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    pickupSlaH: 4,
    pickupCode: '6753',
    notes: 'Cliente Diamond · embalagem premium · cartão à mão.',
  },
  {
    id: 'OMS-2026-001340',
    channel: 'web',
    fulfillmentMode: 'ship_from_store',
    status: 'allocated',
    customerName: 'Camila Ferreira',
    customerCpf: '321.654.987-00',
    customerPhone: '+55 21 98877-6655',
    storeSlug: 'morumbi',
    fromStoreSlug: 'morumbi',
    destinationCity: 'Niterói',
    destinationUf: 'RJ',
    items: [
      {
        sku: 'PG-LIFE-VTNG',
        productName: 'Pingente Vintage',
        quantity: 1,
        unitPrice: 359,
      },
    ],
    totalAmount: 359,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    shippingSlaH: 24,
    carrier: 'rapiddo',
  },
  {
    id: 'OMS-2026-001352',
    channel: 'app',
    fulfillmentMode: 'ship_from_store',
    status: 'packed',
    customerName: 'Roberto Mello',
    customerCpf: '789.123.456-00',
    customerPhone: '+55 11 95566-7788',
    storeSlug: 'morumbi',
    fromStoreSlug: 'morumbi',
    destinationCity: 'São Paulo',
    destinationUf: 'SP',
    items: [
      {
        sku: 'RG-VVR-CRNL',
        productName: 'Anel Solitário 18k',
        quantity: 1,
        unitPrice: 4299,
      },
    ],
    totalAmount: 4299,
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    shippingSlaH: 4,
    carrier: 'loggi',
    awbCode: 'LGI-2026-AB873291',
  },
  {
    id: 'OMS-2026-001361',
    channel: 'instagram',
    fulfillmentMode: 'ship_from_store',
    status: 'in_transit',
    customerName: 'Ana Clara Pinto',
    customerCpf: '147.258.369-00',
    customerPhone: '+55 31 99988-3344',
    storeSlug: 'morumbi',
    fromStoreSlug: 'morumbi',
    destinationCity: 'Belo Horizonte',
    destinationUf: 'MG',
    items: [
      {
        sku: 'PU-LIFE-LBRT',
        productName: 'Pulseira Liberte',
        quantity: 1,
        unitPrice: 549,
      },
    ],
    totalAmount: 549,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    shippingSlaH: 48,
    carrier: 'jadlog',
    awbCode: 'JL-LX-9988123',
  },
  {
    id: 'OMS-2026-001378',
    channel: 'web',
    fulfillmentMode: 'ship_from_dc',
    status: 'paid',
    customerName: 'Felipe Rocha',
    customerCpf: '258.369.147-00',
    storeSlug: 'morumbi',
    destinationCity: 'Curitiba',
    destinationUf: 'PR',
    items: [
      {
        sku: 'RL-LIFE-LXSR',
        productName: 'Relógio Luxor Series',
        quantity: 1,
        unitPrice: 8999,
      },
    ],
    totalAmount: 8999,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    shippingSlaH: 72,
    carrier: 'correios_sedex',
  },
];

export function findOrdersByStore(slug: string): OmsOrder[] {
  return omsOrders.filter((o) => o.storeSlug === slug);
}

export function findOrderByPickupCode(code: string): OmsOrder | undefined {
  return omsOrders.find((o) => o.pickupCode === code);
}

export function findOrdersByCpf(cpf: string): OmsOrder[] {
  const clean = cpf.replace(/\D/g, '');
  return omsOrders.filter((o) => o.customerCpf.replace(/\D/g, '') === clean);
}

export const STATUS_LABEL: Record<OmsStatus, string> = {
  created: 'Criado',
  paid: 'Pago',
  allocated: 'Alocado',
  picking: 'Em separação',
  packed: 'Embalado',
  ready_for_pickup: 'Pronto p/ retirada',
  in_transit: 'Em trânsito',
  delivered: 'Entregue',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const STATUS_TONE: Record<OmsStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  created: 'info',
  paid: 'info',
  allocated: 'warning',
  picking: 'warning',
  packed: 'warning',
  ready_for_pickup: 'success',
  in_transit: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
};

export const CHANNEL_LABEL: Record<OrderChannel, string> = {
  web: 'Site',
  app: 'App',
  whatsapp: 'WhatsApp',
  pdv: 'PDV',
  instagram: 'Instagram',
};

export const FULFILLMENT_LABEL: Record<FulfillmentMode, string> = {
  bopis: 'Retirada na loja',
  ship_from_store: 'Ship-from-Store',
  ship_from_dc: 'Envio do CD',
  pickup_curbside: 'Curbside',
};
