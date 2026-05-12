import { lazy } from 'react';
import { Route } from 'react-router-dom';

/**
 * VendasRoutes · sub-rotas do módulo Vendas.
 *
 * Padrão Eliza/Fourblox: cada módulo declara seus children Routes como
 * Fragment, que é spread-ado dentro do `<Route>` parent no AppRoutes.
 * Esse pattern é o único que funciona com React Router 6 + index route +
 * multi-tenant prefix sem `<Routes>` aninhado.
 */
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const CatalogPage = lazy(() =>
  import('@/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })),
);
const ProductPage = lazy(() =>
  import('@/pages/ProductPage').then((m) => ({ default: m.ProductPage })),
);
const CustomerProfilePage = lazy(() =>
  import('@/pages/CustomerProfilePage').then((m) => ({ default: m.CustomerProfilePage })),
);
const CartPage = lazy(() => import('@/pages/CartPage').then((m) => ({ default: m.CartPage })));
const PaymentPage = lazy(() =>
  import('@/pages/PaymentPage').then((m) => ({ default: m.PaymentPage })),
);
const ManagerDashboardPage = lazy(() =>
  import('@/pages/ManagerDashboardPage').then((m) => ({ default: m.ManagerDashboardPage })),
);
const ServiceOrderPage = lazy(() =>
  import('@/pages/ServiceOrderPage').then((m) => ({ default: m.ServiceOrderPage })),
);
const TrocaPage = lazy(() => import('@/pages/TrocaPage').then((m) => ({ default: m.TrocaPage })));
const FiscalPage = lazy(() =>
  import('@/pages/FiscalPage').then((m) => ({ default: m.FiscalPage })),
);
const TaxAdminPage = lazy(() =>
  import('@/pages/TaxAdminPage').then((m) => ({ default: m.TaxAdminPage })),
);

// Fase 2 · Omnichannel
const BopisPage = lazy(() => import('@/pages/BopisPage').then((m) => ({ default: m.BopisPage })));
const ShipFromStorePage = lazy(() =>
  import('@/pages/ShipFromStorePage').then((m) => ({ default: m.ShipFromStorePage })),
);
const EndlessAislePage = lazy(() =>
  import('@/pages/EndlessAislePage').then((m) => ({ default: m.EndlessAislePage })),
);
const OmsEnterprisePage = lazy(() =>
  import('@/pages/OmsEnterprisePage').then((m) => ({ default: m.OmsEnterprisePage })),
);

// Fase 2 · Clienteling
const WishlistsPage = lazy(() =>
  import('@/pages/WishlistsPage').then((m) => ({ default: m.WishlistsPage })),
);
const WhatsAppPage = lazy(() =>
  import('@/pages/WhatsAppPage').then((m) => ({ default: m.WhatsAppPage })),
);
const AppointmentsPage = lazy(() =>
  import('@/pages/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })),
);
const ClientelingInboxPage = lazy(() =>
  import('@/pages/ClientelingInboxPage').then((m) => ({ default: m.ClientelingInboxPage })),
);

// Fase 2 · Joalheria
const ConsignmentPage = lazy(() =>
  import('@/pages/ConsignmentPage').then((m) => ({ default: m.ConsignmentPage })),
);
const RfidInventoryPage = lazy(() =>
  import('@/pages/RfidInventoryPage').then((m) => ({ default: m.RfidInventoryPage })),
);

// Fase 2 · Living Intelligence
const InventoryTwinPage = lazy(() =>
  import('@/pages/InventoryTwinPage').then((m) => ({ default: m.InventoryTwinPage })),
);
const NocOpsPage = lazy(() =>
  import('@/pages/NocOpsPage').then((m) => ({ default: m.NocOpsPage })),
);

// Fase 2 · Crediário
const CrediarioPage = lazy(() =>
  import('@/pages/CrediarioPage').then((m) => ({ default: m.CrediarioPage })),
);

export const VendasRoutes = (
  <>
    <Route index element={<HomePage />} />
    <Route path="catalogo" element={<CatalogPage />} />
    <Route path="produto/:id" element={<ProductPage />} />
    <Route path="cliente/:id" element={<CustomerProfilePage />} />
    <Route path="carrinho" element={<CartPage />} />
    <Route path="pagamento" element={<PaymentPage />} />
    <Route path="painel" element={<ManagerDashboardPage />} />
    <Route path="os" element={<ServiceOrderPage />} />
    <Route path="troca" element={<TrocaPage />} />
    <Route path="fiscal" element={<FiscalPage />} />
    <Route path="admin/tributos" element={<TaxAdminPage />} />

    {/* Fase 2 · Omnichannel */}
    <Route path="bopis" element={<BopisPage />} />
    <Route path="ship-from-store" element={<ShipFromStorePage />} />
    <Route path="catalogo-estendido" element={<EndlessAislePage />} />
    <Route path="oms" element={<OmsEnterprisePage />} />

    {/* Fase 2 · Clienteling */}
    <Route path="wishlists" element={<WishlistsPage />} />
    <Route path="whatsapp" element={<WhatsAppPage />} />
    <Route path="agendamentos" element={<AppointmentsPage />} />
    <Route path="inbox-clienteling" element={<ClientelingInboxPage />} />

    {/* Fase 2 · Joalheria */}
    <Route path="consignacao" element={<ConsignmentPage />} />
    <Route path="rfid" element={<RfidInventoryPage />} />

    {/* Fase 2 · Living Intelligence */}
    <Route path="inventario-vivo" element={<InventoryTwinPage />} />
    <Route path="noc" element={<NocOpsPage />} />

    {/* Fase 2 · Crediário */}
    <Route path="crediario" element={<CrediarioPage />} />
  </>
);
