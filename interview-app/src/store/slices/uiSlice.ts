import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  activeTab: 'interviewee' | 'interviewer';
  sidebarCollapsed: boolean;
  loading: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  activeTab: 'interviewee',
  sidebarCollapsed: false,
  loading: false,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<UIState['activeTab']>) => {
      state.activeTab = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload;
    },
  },
});

export const {
  setActiveTab,
  toggleSidebar,
  setLoading,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;