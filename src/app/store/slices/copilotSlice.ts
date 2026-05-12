import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CopilotNudge } from '@/types';
import { copilotNudges } from '@/data/mocks';

interface CopilotFeedback {
  nudgeId: string;
  action: 'accepted' | 'rejected' | 'dismissed';
  reason?: string;
  at: string;
}

interface CopilotState {
  nudges: CopilotNudge[];
  dismissedIds: string[];
  acceptedIds: string[];
  rejectedIds: string[];
  feedback: CopilotFeedback[];
  open: boolean;
}

const initialState: CopilotState = {
  nudges: copilotNudges,
  dismissedIds: [],
  acceptedIds: [],
  rejectedIds: [],
  feedback: [],
  open: true,
};

const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    dismissNudge(state, action: PayloadAction<string>) {
      if (!state.dismissedIds.includes(action.payload)) {
        state.dismissedIds.push(action.payload);
        state.feedback.push({
          nudgeId: action.payload,
          action: 'dismissed',
          at: new Date().toISOString(),
        });
      }
    },
    acceptNudge(state, action: PayloadAction<string>) {
      if (!state.acceptedIds.includes(action.payload)) {
        state.acceptedIds.push(action.payload);
      }
      if (!state.dismissedIds.includes(action.payload)) {
        state.dismissedIds.push(action.payload);
      }
      state.feedback.push({
        nudgeId: action.payload,
        action: 'accepted',
        at: new Date().toISOString(),
      });
    },
    rejectNudge(
      state,
      action: PayloadAction<{ id: string; reason?: string }>,
    ) {
      if (!state.rejectedIds.includes(action.payload.id)) {
        state.rejectedIds.push(action.payload.id);
      }
      if (!state.dismissedIds.includes(action.payload.id)) {
        state.dismissedIds.push(action.payload.id);
      }
      state.feedback.push({
        nudgeId: action.payload.id,
        action: 'rejected',
        reason: action.payload.reason,
        at: new Date().toISOString(),
      });
    },
    toggleCopilot(state) {
      state.open = !state.open;
    },
    setCopilotOpen(state, action: PayloadAction<boolean>) {
      state.open = action.payload;
    },
    resetCopilot(state) {
      state.dismissedIds = [];
      state.acceptedIds = [];
      state.rejectedIds = [];
      state.feedback = [];
    },
  },
});

export const {
  dismissNudge,
  acceptNudge,
  rejectNudge,
  toggleCopilot,
  setCopilotOpen,
  resetCopilot,
} = copilotSlice.actions;
export default copilotSlice.reducer;
