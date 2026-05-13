/**
 * Utilitários de CPF (BR)
 *
 * - `unmaskCpf` extrai apenas dígitos.
 * - `maskCpfInput` aplica máscara progressiva `000.000.000-00` em tempo real,
 *   pensada para ser chamada no `onChange` de um input controlado.
 * - `validateCpf` faz a validação completa do dígito verificador conforme
 *   algoritmo da Receita Federal, rejeitando também sequências repetidas
 *   (000.000.000-00, 111.111.111-11, ...).
 *
 * NOTA · em produção a verificação real continua sendo feita via SERPRO/
 * Receita Federal. Aqui validamos apenas a estrutura para evitar idas
 * desnecessárias ao serviço externo.
 */

export function unmaskCpf(value: string): string {
  return (value ?? '').replace(/\D/g, '');
}

export function maskCpfInput(value: string): string {
  const digits = unmaskCpf(value).slice(0, 11);
  const len = digits.length;
  if (len === 0) return '';
  if (len <= 3) return digits;
  if (len <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (len <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function validateCpf(cpf: string): boolean {
  const d = unmaskCpf(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const calc = (slice: string, factorStart: number): number => {
    let sum = 0;
    for (let i = 0; i < slice.length; i += 1) {
      sum += Number(slice[i]) * (factorStart - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const dv1 = calc(d.slice(0, 9), 10);
  if (dv1 !== Number(d[9])) return false;
  const dv2 = calc(d.slice(0, 10), 11);
  if (dv2 !== Number(d[10])) return false;
  return true;
}
