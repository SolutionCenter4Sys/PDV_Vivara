import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Brand, Seller } from '@/types';

interface AuthState {
  seller: Seller | null;
  brand: Brand;
  authMode: 'pin' | 'sso' | null;
  ssoEmail: string | null;
}

const initialState: AuthState = {
  seller: null,
  brand: 'vivara',
  authMode: null,
  ssoEmail: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginPinSuccess(state, action: PayloadAction<Seller>) {
      state.seller = action.payload;
      state.brand = action.payload.brand;
      state.authMode = 'pin';
      state.ssoEmail = null;
    },
    loginSsoSuccess(state, action: PayloadAction<{ seller: Seller; email: string }>) {
      state.seller = action.payload.seller;
      state.brand = action.payload.seller.brand;
      state.authMode = 'sso';
      state.ssoEmail = action.payload.email;
    },
    logout(state) {
      state.seller = null;
      state.authMode = null;
      state.ssoEmail = null;
    },
    setBrand(state, action: PayloadAction<Brand>) {
      state.brand = action.payload;
    },
  },
});

export const { loginPinSuccess, loginSsoSuccess, logout, setBrand } = authSlice.actions;
export default authSlice.reducer;
