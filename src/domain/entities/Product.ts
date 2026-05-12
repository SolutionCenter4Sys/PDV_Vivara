/**
 * Entity `Product` · enxuta · expõe APENAS o que a UI usa.
 *
 * Campos internos do back (tbOrgId, costPrice, supplierId, etc.) NÃO
 * vazam para a presentation. Mapping DTO→Entity ocorre no RepositoryImpl.
 */
export type ProductCategory =
  | 'aneis'
  | 'colares'
  | 'brincos'
  | 'pulseiras'
  | 'aliancas'
  | 'relogios'
  | 'pingentes'
  | 'kids';

export type Brand = 'vivara' | 'life';

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
  weightG: number;
  goldKarat?: number;
  metal: string;
  stones?: string;
  hasCertificate: boolean;
  warranty: string;
  stockLocal: number;
  stockNetwork: number;
  imageUrl: string;
  imageAlt?: string;
  tag?: 'novo' | 'limitada' | 'bestseller';
}

export interface ProductFilter {
  category?: ProductCategory;
  brand?: Brand;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}
