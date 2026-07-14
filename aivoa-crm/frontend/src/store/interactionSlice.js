import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  interactions: [],
  weeklySummary: '',
  todayFollowUps: [],
  loading: false,
  error: null,
};

const interactionSlice = createSlice({
  name: 'interactions',
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSuccess: (state, action) => {
      state.loading = false;
      state.interactions = action.payload;
    },
    fetchFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addInteractionSuccess: (state, action) => {
      state.interactions = [action.payload, ...state.interactions];
    },
    updateInteractionSuccess: (state, action) => {
      state.interactions = state.interactions.map((interaction) =>
        interaction.id === action.payload.id ? action.payload : interaction
      );
    },
    setWeeklySummary: (state, action) => {
      state.weeklySummary = action.payload;
    },
    setTodayFollowUps: (state, action) => {
      state.todayFollowUps = action.payload;
    },
  },
});

export const {
  fetchStart,
  fetchSuccess,
  fetchFailure,
  addInteractionSuccess,
  updateInteractionSuccess,
  setWeeklySummary,
  setTodayFollowUps,
} = interactionSlice.actions;

export default interactionSlice.reducer;
