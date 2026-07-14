import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your AI CRM Assistant. I can help you log doctor interactions, search doctor histories, check today\'s follow-ups, or get a weekly summary. How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ],
  extractedData: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    sendMessageStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    sendMessageSuccess: (state, action) => {
      state.loading = false;
      state.messages = [...state.messages, action.payload.message];
      if (action.payload.extractedData) {
        state.extractedData = action.payload.extractedData;
      }
    },
    sendMessageFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addLocalMessage: (state, action) => {
      state.messages = [...state.messages, action.payload];
    },
    clearChat: (state) => {
      state.messages = [
        {
          id: 'welcome',
          sender: 'assistant',
          text: 'Hello! I am your AI CRM Assistant. I can help you log doctor interactions, search doctor histories, check today\'s follow-ups, or get a weekly summary. How can I help you today?',
          timestamp: new Date().toISOString(),
        },
      ];
      state.extractedData = null;
      state.error = null;
    },
    setExtractedData: (state, action) => {
      state.extractedData = action.payload;
    },
    clearExtractedData: (state) => {
      state.extractedData = null;
    },
  },
});

export const {
  sendMessageStart,
  sendMessageSuccess,
  sendMessageFailure,
  addLocalMessage,
  clearChat,
  setExtractedData,
  clearExtractedData,
} = chatSlice.actions;

export default chatSlice.reducer;
