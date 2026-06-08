import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PaginatedReports, PaginationMeta, ReportRequest } from '../types/index';

interface ReportsState {
  items: ReportRequest[];
  pagination: PaginationMeta;
}

const emptyPagination: PaginationMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const initialState: ReportsState = {
  items: [],
  pagination: emptyPagination,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setReports(state, action: PayloadAction<PaginatedReports>) {
      state.items = action.payload.reports;
      state.pagination = action.payload.pagination;
    },
    addReportRequest(state, action: PayloadAction<ReportRequest>) {
      state.items.unshift(action.payload);
    },
    upsertReportRequest(state, action: PayloadAction<ReportRequest>) {
      const index = state.items.findIndex((report) => report.id === action.payload.id);
      if (index === -1) {
        state.items.unshift(action.payload);
        return;
      }

      state.items[index] = action.payload;
    },
    removeReportRequest(state, action: PayloadAction<number>) {
      state.items = state.items.filter((report) => report.id !== action.payload);
    },
    clearReportsState() {
      return initialState;
    },
  },
});

export const {
  setReports,
  addReportRequest,
  upsertReportRequest,
  removeReportRequest,
  clearReportsState,
} = reportsSlice.actions;
export default reportsSlice.reducer;
