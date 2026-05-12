import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * EP-03-F3 · Wishlist + Recomendações IA.
 *
 * Wishlist por cliente · cada cliente pode ter múltiplas listas nomeadas
 * ("Aniversário 30 anos", "Dia das Mães"). Sincroniza com app/web em
 * produção via /api/customers/:id/wishlists (Salesforce CDP).
 */

export interface WishlistItem {
  productId: string;
  addedAt: string;
  note?: string;
}

export interface Wishlist {
  id: string;
  customerId: string;
  name: string;
  items: WishlistItem[];
}

interface WishlistState {
  lists: Wishlist[];
}

const initialState: WishlistState = {
  lists: [
    {
      id: 'WL-CUST-001-1',
      customerId: 'CUST-001',
      name: 'Aniversário 30 anos',
      items: [
        { productId: 'PROD-LIFE-002', addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
        { productId: 'PROD-VVR-005', addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), note: 'gostou na vitrine' },
      ],
    },
  ],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addList: (state, action: PayloadAction<{ customerId: string; name: string }>) => {
      state.lists.push({
        id: `WL-${Date.now().toString(36).toUpperCase()}`,
        customerId: action.payload.customerId,
        name: action.payload.name,
        items: [],
      });
    },
    addItem: (
      state,
      action: PayloadAction<{ listId: string; productId: string; note?: string }>,
    ) => {
      const list = state.lists.find((l) => l.id === action.payload.listId);
      if (list && !list.items.some((i) => i.productId === action.payload.productId)) {
        list.items.push({
          productId: action.payload.productId,
          addedAt: new Date().toISOString(),
          note: action.payload.note,
        });
      }
    },
    removeItem: (state, action: PayloadAction<{ listId: string; productId: string }>) => {
      const list = state.lists.find((l) => l.id === action.payload.listId);
      if (list) list.items = list.items.filter((i) => i.productId !== action.payload.productId);
    },
    addItemToDefaultList: (
      state,
      action: PayloadAction<{ customerId: string; productId: string }>,
    ) => {
      let list = state.lists.find((l) => l.customerId === action.payload.customerId);
      if (!list) {
        list = {
          id: `WL-${Date.now().toString(36).toUpperCase()}`,
          customerId: action.payload.customerId,
          name: 'Favoritos',
          items: [],
        };
        state.lists.push(list);
      }
      if (!list.items.some((i) => i.productId === action.payload.productId)) {
        list.items.push({
          productId: action.payload.productId,
          addedAt: new Date().toISOString(),
        });
      }
    },
    removeItemFromAll: (
      state,
      action: PayloadAction<{ customerId: string; productId: string }>,
    ) => {
      state.lists
        .filter((l) => l.customerId === action.payload.customerId)
        .forEach((l) => {
          l.items = l.items.filter((i) => i.productId !== action.payload.productId);
        });
    },
  },
});

export const { addList, addItem, removeItem, addItemToDefaultList, removeItemFromAll } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;
