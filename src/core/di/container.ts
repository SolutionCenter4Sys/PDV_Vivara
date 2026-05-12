/**
 * Container TSyringe global do PDV Vivara.
 *
 * **REGRA DE OURO** (padrão Fourmakers v2):
 *   Este arquivo recebe APENAS um import + uma chamada de register
 *   por módulo. NUNCA editar "no meio" — apenas append. Diff mínimo.
 *
 * O bootstrap real (registers ordenados) vive em `bootstrap.ts`.
 */
import 'reflect-metadata';
import { container as rootContainer } from 'tsyringe';
import type { DependencyContainer } from 'tsyringe';

export const container: DependencyContainer = rootContainer;

/**
 * Helper para registrar UseCase por classe (sem Symbol).
 * `reg(c, Cls)` é açúcar para `c.register(Cls, { useClass: Cls })`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reg<T>(c: DependencyContainer, Cls: new (...args: any[]) => T): void {
  c.register(Cls, { useClass: Cls });
}

/**
 * HMR helper · evita instâncias duplicadas em dev.
 */
export function clearDependencyInjectionInstancesForHmr(): void {
  rootContainer.clearInstances();
}
