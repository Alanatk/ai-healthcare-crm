import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import interactionReducer from './interactionSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    interactions: interactionReducer,
    chat: chatReducer,
  },
});

export default store;
