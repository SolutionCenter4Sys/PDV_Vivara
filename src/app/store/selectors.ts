import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

const cartItems = (s: RootState) => s.cart.items;

export const selectCartSubtotal = createSelector(cartItems, (items) =>
  items.reduce((sum, c) => sum + c.product.price * c.quantity, 0),
);

export const selectCartDiscount = createSelector(cartItems, (items) =>
  items.reduce((sum, c) => {
    const disc = c.customDiscountPct ?? 0;
    return sum + (c.product.price * c.quantity * disc) / 100;
  }, 0),
);

export const selectCartTotal = createSelector(
  selectCartSubtotal,
  selectCartDiscount,
  (subtotal, discount) => subtotal - discount,
);

export const selectCartCount = createSelector(cartItems, (items) =>
  items.reduce((sum, c) => sum + c.quantity, 0),
);

export const selectIsOffline = (s: RootState) => s.connectivity.status === 'offline';
export const selectActiveNudges = createSelector(
  (s: RootState) => s.copilot.nudges,
  (s: RootState) => s.copilot.dismissedIds,
  (nudges, dismissed) => nudges.filter((n) => !dismissed.includes(n.id)),
);
