export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatBRLDecimal(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatPercent(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
  });
}

export function formatRelativeDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'futura';
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 30) return `há ${diffDays} dias`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  return `há ${Math.floor(diffDays / 365)} anos`;
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    diamond: 'VIP Diamond',
    gold: 'Gold',
    silver: 'Silver',
    standard: 'Cliente',
  };
  return map[tier] ?? tier;
}

export function maskCpf(cpf: string): string {
  return cpf.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, '$1.***.***-$2');
}
