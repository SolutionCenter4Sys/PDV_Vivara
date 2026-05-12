import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrgConfig } from '@app/multitenant/orgConfigs';

interface TenantState {
  active: OrgConfig | null;
}

const initialState: TenantState = { active: null };

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setActiveTenant(state, action: PayloadAction<OrgConfig>) {
      state.active = action.payload;
    },
    clearActiveTenant(state) {
      state.active = null;
    },
  },
});

export const { setActiveTenant, clearActiveTenant } = tenantSlice.actions;
export default tenantSlice.reducer;
