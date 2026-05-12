/**
 * Tokens do módulo `vendas` · jornada catálogo → carrinho → pagamento.
 *
 * UseCases NÃO precisam de token Symbol porque são resolvidos
 * por classe via container.resolve(Cls). Apenas APIs e Repositories
 * (interfaces) precisam de token explícito.
 */
export const VendasTokens = {
  ProductApi: Symbol.for('vendas.ProductApi'),
  CustomerApi: Symbol.for('vendas.CustomerApi'),
  OrderApi: Symbol.for('vendas.OrderApi'),

  ProductRepository: Symbol.for('vendas.ProductRepository'),
  CustomerRepository: Symbol.for('vendas.CustomerRepository'),
  OrderRepository: Symbol.for('vendas.OrderRepository'),
} as const;
