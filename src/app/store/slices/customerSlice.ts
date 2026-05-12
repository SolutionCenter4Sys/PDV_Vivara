import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Customer } from '@/types';

interface CustomerState {
  active: Customer | null;
}

const initialState: CustomerState = { active: null };

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    selectCustomer(state, action: PayloadAction<Customer | null>) {
      state.active = action.payload;
    },
    clearCustomer(state) {
      state.active = null;
    },
  },
});

export const { selectCustomer, clearCustomer } = customerSlice.actions;
export default customerSlice.reducer;
