import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './store';

/**
 * Hooks tipados · padrão Redux Toolkit + Eliza/Fourblox.
 * Páginas/hooks NUNCA importam useDispatch/useSelector direto.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
