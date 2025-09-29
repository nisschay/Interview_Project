import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import interviewSlice from './slices/interviewSlice';
import uiSlice from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['interview'] // Only persist interview data
};

const rootReducer = combineReducers({
  interview: interviewSlice,
  ui: uiSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;