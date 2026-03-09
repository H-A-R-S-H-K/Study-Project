import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  type Storage,
} from 'redux-persist';
import { MMKV } from 'react-native-mmkv';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

/**
 * Redux Toolkit store with selective persistence via MMKV (fast, synchronous
 * native storage — far quicker than AsyncStorage). Only `auth` and `ui` are
 * persisted; server data is owned by React Query, not Redux, so it is never
 * duplicated in persisted state.
 */
const mmkv = new MMKV();
const mmkvStorage: Storage = {
  setItem: (key, value) => {
    mmkv.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key) => Promise.resolve(mmkv.getString(key) ?? null),
  removeItem: (key) => {
    mmkv.delete(key);
    return Promise.resolve();
  },
};

const rootReducer = combineReducers({ auth: authReducer, ui: uiReducer });

const persistedReducer = persistReducer(
  { key: 'root', storage: mmkvStorage, whitelist: ['auth', 'ui'] },
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
