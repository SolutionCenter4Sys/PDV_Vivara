import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(
      state,
      action: PayloadAction<{ product: Product; quantity?: number }>,
    ) {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) existing.quantity += quantity;
      else state.items.push({ product, quantity });
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.product.id !== action.payload);
    },
    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.product.id !== productId);
        return;
      }
      const item = state.items.find((i) => i.product.id === productId);
      if (item) item.quantity = quantity;
    },
    applyDiscount(
      state,
      action: PayloadAction<{ productId: string; discountPct: number }>,
    ) {
      const item = state.items.find((i) => i.product.id === action.payload.productId);
      if (item) item.customDiscountPct = action.payload.discountPct;
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, applyDiscount, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
