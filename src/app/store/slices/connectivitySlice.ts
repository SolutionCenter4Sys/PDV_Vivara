import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ConnectivityStatus } from '@/types';

interface ConnectivityState {
  status: ConnectivityStatus;
  syncQueue: number;
}

const initialState: ConnectivityState = {
  status: 'online',
  syncQueue: 0,
};

const connectivitySlice = createSlice({
  name: 'connectivity',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<ConnectivityStatus>) {
      state.status = action.payload;
      state.syncQueue =
        action.payload === 'offline' ? Math.floor(Math.random() * 5) + 1 : 0;
    },
    setSyncQueue(state, action: PayloadAction<number>) {
      state.syncQueue = action.payload;
    },
  },
});

export const { setStatus, setSyncQueue } = connectivitySlice.actions;
export default connectivitySlice.reducer;
