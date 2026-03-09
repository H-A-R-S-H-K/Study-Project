import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'system' | 'light' | 'dark';

/** UI preferences that persist across sessions (theme, language). */
export interface UiState {
  themeMode: ThemeMode;
  language: string;
}

const initialState: UiState = { themeMode: 'system', language: 'en' };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
    },
  },
});

export const { setThemeMode, setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
