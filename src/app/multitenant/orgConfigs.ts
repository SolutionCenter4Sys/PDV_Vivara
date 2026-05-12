import type { Brand } from '@/types';

/**
 * Multi-tenant por rota · padrão Fourmakers v2 (11 orgs originais).
 *
 * No PDV Vivara cada "org" é uma loja âncora ou flagship.
 * Slug aparece em `/loja/:storeSlug/...` e determina:
 *   - brand (vivara | life)
 *   - tema visual (cores secundárias / banner)
 *   - timezone, UF, cidade
 *   - políticas fiscais (CBS+IBS por UF)
 *   - cluster do iPaaS Digibee
 *
 * Em produção este array vem do SAP S/4HANA Retail · 498 lojas.
 */

export interface OrgConfig {
  slug: string; // usado na URL · kebab-case · sem acento
  storeId: string; // SAP code
  name: string;
  brand: Brand;
  city: string;
  uf: string;
  timezone: string;
  cnpj: string;
  fiscal: {
    icms: number;
    cbs: number;
    ibs: number;
    nfceSerie: string;
  };
  ipaasCluster: 'sao-paulo' | 'rio' | 'nordeste' | 'sul' | 'centro-oeste';
  flagship: boolean;
}

export const orgConfigs: OrgConfig[] = [
  {
    slug: 'morumbi',
    storeId: 'IT-MORUMBI',
    name: 'Vivara Morumbi',
    brand: 'vivara',
    city: 'São Paulo',
    uf: 'SP',
    timezone: 'America/Sao_Paulo',
    cnpj: '53.398.738/0024-19',
    fiscal: { icms: 18, cbs: 8.8, ibs: 17.7, nfceSerie: '24' },
    ipaasCluster: 'sao-paulo',
    flagship: true,
  },
  {
    slug: 'iguatemi-sp',
    storeId: 'IT-IGUATEMI',
    name: 'Vivara Iguatemi SP',
    brand: 'vivara',
    city: 'São Paulo',
    uf: 'SP',
    timezone: 'America/Sao_Paulo',
    cnpj: '53.398.738/0008-77',
    fiscal: { icms: 18, cbs: 8.8, ibs: 17.7, nfceSerie: '08' },
    ipaasCluster: 'sao-paulo',
    flagship: true,
  },
  {
    slug: 'jk-iguatemi',
    storeId: 'IT-JK',
    name: 'Vivara JK Iguatemi',
    brand: 'vivara',
    city: 'São Paulo',
    uf: 'SP',
    timezone: 'America/Sao_Paulo',
    cnpj: '53.398.738/0042-11',
    fiscal: { icms: 18, cbs: 8.8, ibs: 17.7, nfceSerie: '42' },
    ipaasCluster: 'sao-paulo',
    flagship: true,
  },
  {
    slug: 'villa-lobos',
    storeId: 'IT-VILLA-LOBOS',
    name: 'Vivara Shopping Villa-Lobos',
    brand: 'vivara',
    city: 'São Paulo',
    uf: 'SP',
    timezone: 'America/Sao_Paulo',
    cnpj: '53.398.738/0033-55',
    fiscal: { icms: 18, cbs: 8.8, ibs: 17.7, nfceSerie: '33' },
    ipaasCluster: 'sao-paulo',
    flagship: false,
  },
  {
    slug: 'barra-rj',
    storeId: 'IT-BARRA',
    name: 'Vivara Barra Shopping',
    brand: 'vivara',
    city: 'Rio de Janeiro',
    uf: 'RJ',
    timezone: 'America/Sao_Paulo',
    cnpj: '53.398.738/0061-10',
    fiscal: { icms: 20, cbs: 8.8, ibs: 18.5, nfceSerie: '61' },
    ipaasCluster: 'rio',
    flagship: true,
  },
  {
    slug: 'rio-sul',
    storeId: 'IT-RIOSUL',
    name: 'Vivara Rio Sul',
    brand: 'vivara',
    city: 'Rio de Janeiro',
    uf: 'RJ',
    timezone: 'America/Sao_Paulo',
    cnpj: '53.398.738/0062-91',
    fiscal: { icms: 20, cbs: 8.8, ibs: 18.5, nfceSerie: '62' },
    ipaasCluster: 'rio',
    flagship: false,
  },
  {
    slug: 'salvador-shopping',
    storeId: 'IT-SSA',
    name: 'Vivara Salvador Shopping',
    brand: 'vivara',
    city: 'Salvador',
    uf: 'BA',
    timezone: 'America/Bahia',
    cnpj: '53.398.738/0078-01',
    fiscal: { icms: 18, cbs: 8.8, ibs: 17.5, nfceSerie: '78' },
    ipaasCluster: 'nordeste',
    flagship: false,
  },
  {
    slug: 'recife-riomar',
    storeId: 'IT-REC',
    name: 'Vivara RioMar Recife',
    brand: 'vivara',
    city: 'Recife',
    uf: 'PE',
    timezone: 'America/Recife',
    cnpj: '53.398.738/0090-44',
    fiscal: { icms: 18, cbs: 8.8, ibs: 17.5, nfceSerie: '90' },
    ipaasCluster: 'nordeste',
    flagship: false,
  },
  {
    slug: 'curitiba-park',
    storeId: 'IT-CWB',
    name: 'Vivara Park Shopping Barigui',
    brand: 'vivara',
    city: 'Curitiba',
    uf: 'PR',
    timezone: 'America/Sao_Paulo',
    cnpj: '53.398.738/0102-02',
    fiscal: { icms: 18, cbs: 8.8, ibs: 17.5, nfceSerie: '02' },
    ipaasCluster: 'sul',
    flagship: false,
  },
  {
    slug: 'porto-alegre',
    storeId: 'IT-POA',
    name: 'Vivara Iguatemi POA',
    brand: 'vivara',
    city: 'Porto Alegre',
    uf: 'RS',
    timezone: 'America/Sao_Paulo',
    cnpj: '53.398.738/0115-67',
    fiscal: { icms: 17, cbs: 8.8, ibs: 17.0, nfceSerie: '15' },
    ipaasCluster: 'sul',
    flagship: false,
  },
  {
    slug: 'brasilia-conjunto',
    storeId: 'IT-BSB',
    name: 'Vivara Conjunto Nacional Brasília',
    brand: 'vivara',
    city: 'Brasília',
    uf: 'DF',
    timezone: 'America/Sao_Paulo',
    cnpj: '53.398.738/0124-08',
    fiscal: { icms: 18, cbs: 8.8, ibs: 17.5, nfceSerie: '24' },
    ipaasCluster: 'centro-oeste',
    flagship: true,
  },
];

const slugIndex = new Map(orgConfigs.map((o) => [o.slug, o]));
const storeIdIndex = new Map(orgConfigs.map((o) => [o.storeId, o]));

export function getOrgBySlug(slug?: string): OrgConfig | undefined {
  return slug ? slugIndex.get(slug) : undefined;
}

export function getOrgByStoreId(storeId?: string): OrgConfig | undefined {
  return storeId ? storeIdIndex.get(storeId) : undefined;
}

export const DEFAULT_ORG_SLUG = 'morumbi';
